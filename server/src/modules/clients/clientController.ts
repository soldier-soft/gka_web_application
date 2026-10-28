import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Client } from '../../models/Client';
import { User } from '../../models/User';
import { Project } from '../../models/Project';
import { Invoice } from '../../models/Invoice';
import { Quotation } from '../../models/Quotation';
import { formatClientPortalUsername } from '../../shared/constants';

/**
 * Get all client profiles with portal credentials and linked project workspaces
 */
export const getClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });

    const enrichedClients = await Promise.all(
      clients.map(async (client) => {
        // Look up portal user account
        let user = await User.findOne({
          $or: [
            { clientId: client._id },
            { _id: client.userId },
            { email: client.email.toLowerCase() },
          ],
        });

        // If user doesn't exist, create one automatically with standardized @gkaconstruction.com username
        if (!user) {
          const portalUsername = client.email.includes('@gkaconstruction.com')
            ? client.email.toLowerCase()
            : formatClientPortalUsername(client.name);
          const rawPassword = `GKA@${(client.phone || '').replace(/\D/g, '').slice(-4) || '2026'}`;
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(rawPassword, salt);

          try {
            user = await User.create({
              name: client.name,
              email: portalUsername,
              phone: client.phone || '8838030917',
              passwordHash,
              defaultPassword: rawPassword,
              role: 'client',
              clientId: client._id,
              assignedProjects: [],
              isActive: true,
            });
            await Client.findByIdAndUpdate(client._id, { userId: user._id, email: portalUsername });
          } catch (createErr) {
            // In case email conflict, find existing user
            user = await User.findOne({ email: portalUsername });
          }
        }

        // Look up linked projects
        const projects = await Project.find({
          $or: [{ clientId: client._id }, { _id: { $in: user?.assignedProjects || [] } }],
        }).select(
          '_id projectId title category status progressPercent siteAddress contractValuePaise invoicedAmountPaise collectedAmountPaise'
        );

        // Calculate financial statistics
        let totalContractPaise = 0;
        let totalInvoicedPaise = 0;
        let totalCollectedPaise = 0;

        projects.forEach((p) => {
          totalContractPaise += p.contractValuePaise || 0;
          totalInvoicedPaise += p.invoicedAmountPaise || 0;
          totalCollectedPaise += p.collectedAmountPaise || 0;
        });

        const totalBalanceDuePaise = Math.max(0, totalInvoicedPaise - totalCollectedPaise);

        return {
          _id: client._id,
          name: client.name,
          companyName: client.companyName || '',
          phone: client.phone,
          alternatePhone: client.alternatePhone || '',
          email: user?.email || client.email,
          billingAddress: client.billingAddress || {
            street: '',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '',
          },
          notes: client.notes || '',
          portalUsername: user?.email || formatClientPortalUsername(client.name),
          portalPassword: user?.defaultPassword || 'GKAclient2026!',
          userIsActive: user ? user.isActive : true,
          lastLoginAt: user?.lastLoginAt,
          projects,
          totalProjects: projects.length,
          totalContractPaise,
          totalInvoicedPaise,
          totalCollectedPaise,
          totalBalanceDuePaise,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
        };
      })
    );

    res.json({ success: true, count: enrichedClients.length, clients: enrichedClients });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single client profile by ID with projects and financial transactions
 */
export const getClientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);

    if (!client) {
      res.status(404).json({ success: false, message: 'Client profile not found' });
      return;
    }

    const user = await User.findOne({
      $or: [
        { clientId: client._id },
        { _id: client.userId },
        { email: client.email.toLowerCase() },
      ],
    });

    const projects = await Project.find({
      $or: [{ clientId: client._id }, { _id: { $in: user?.assignedProjects || [] } }],
    }).sort({ createdAt: -1 });

    const invoices = await Invoice.find({ clientId: client._id }).sort({ issueDate: -1 });
    const quotations = await Quotation.find({ clientId: client._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      client,
      portalUser: user
        ? {
            email: user.email,
            defaultPassword: user.defaultPassword,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
          }
        : null,
      projects,
      invoices,
      quotations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new Client Profile with an official @gkaconstruction.com portal login account
 */
export const createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      companyName,
      phone,
      alternatePhone,
      email,
      portalPassword,
      billingAddress,
      notes,
      assignedProjectIds,
    } = req.body;

    if (!name || !phone) {
      res.status(400).json({ success: false, message: 'Client name and phone number are required.' });
      return;
    }

    // Standardize portal username: if provided with @gkaconstruction.com use it, else format it
    let portalUsername = (email || '').trim().toLowerCase();
    if (!portalUsername || !portalUsername.includes('@')) {
      portalUsername = formatClientPortalUsername(name);
    } else if (!portalUsername.endsWith('@gkaconstruction.com')) {
      // Allow custom email or append domain
      const prefix = portalUsername.split('@')[0].replace(/[^a-z0-9]/g, '');
      portalUsername = `${prefix}@gkaconstruction.com`;
    }

    // Check if username already exists in User collection
    let existingUser = await User.findOne({ email: portalUsername });
    if (existingUser) {
      // Append random 3-digit suffix to make unique
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const prefix = portalUsername.split('@')[0];
      portalUsername = `${prefix}${randomSuffix}@gkaconstruction.com`;
    }

    // Default portal password
    const rawPassword =
      (portalPassword && portalPassword.trim()) ||
      `GKA@${(phone || '').replace(/\D/g, '').slice(-4) || '2026'}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // 1. Create Client record
    const client = await Client.create({
      name: name.trim(),
      companyName: companyName ? companyName.trim() : undefined,
      email: portalUsername,
      phone: phone.trim(),
      alternatePhone: alternatePhone ? alternatePhone.trim() : undefined,
      billingAddress: billingAddress || {
        street: '',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '',
      },
      notes: notes || undefined,
    });

    // 2. Create User account for portal login
    const validProjectIds = Array.isArray(assignedProjectIds)
      ? assignedProjectIds.filter((p: string) => mongoose.Types.ObjectId.isValid(p))
      : [];

    const user = await User.create({
      name: client.name,
      email: portalUsername,
      phone: client.phone,
      passwordHash,
      defaultPassword: rawPassword,
      role: 'client',
      clientId: client._id,
      assignedProjects: validProjectIds,
      isActive: true,
    });

    // Link client to user
    client.userId = user._id as any;
    await client.save();

    // 3. Link specified projects to this client
    if (validProjectIds.length > 0) {
      await Project.updateMany(
        { _id: { $in: validProjectIds } },
        { clientId: client._id }
      );
    }

    res.status(201).json({
      success: true,
      message: `Client Profile ${client.name} created successfully with portal login ${portalUsername}`,
      client,
      portalCredentials: {
        username: portalUsername,
        password: rawPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing Client Profile, contact details, portal credentials, and linked projects
 */
export const updateClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      companyName,
      phone,
      alternatePhone,
      email,
      portalPassword,
      billingAddress,
      notes,
      assignedProjectIds,
      userIsActive,
    } = req.body;

    const client = await Client.findById(id);
    if (!client) {
      res.status(404).json({ success: false, message: 'Client profile not found' });
      return;
    }

    if (name) client.name = name.trim();
    if (companyName !== undefined) client.companyName = companyName.trim();
    if (phone) client.phone = phone.trim();
    if (alternatePhone !== undefined) client.alternatePhone = alternatePhone.trim();
    if (billingAddress) client.billingAddress = billingAddress;
    if (notes !== undefined) client.notes = notes;

    // Handle portal user update
    let user = await User.findOne({
      $or: [
        { clientId: client._id },
        { _id: client.userId },
        { email: client.email.toLowerCase() },
      ],
    });

    let newUsername = (email || '').trim().toLowerCase();
    if (newUsername && !newUsername.endsWith('@gkaconstruction.com') && !newUsername.includes('@')) {
      newUsername = `${newUsername}@gkaconstruction.com`;
    }

    if (!user) {
      // Create user if missing
      const usernameToUse = newUsername || formatClientPortalUsername(client.name);
      const rawPassword = portalPassword?.trim() || `GKA@${(client.phone || '').replace(/\D/g, '').slice(-4) || '2026'}`;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(rawPassword, salt);

      user = await User.create({
        name: client.name,
        email: usernameToUse,
        phone: client.phone,
        passwordHash,
        defaultPassword: rawPassword,
        role: 'client',
        clientId: client._id,
        assignedProjects: Array.isArray(assignedProjectIds) ? assignedProjectIds : [],
        isActive: userIsActive !== undefined ? Boolean(userIsActive) : true,
      });

      client.userId = user._id as any;
      client.email = usernameToUse;
    } else {
      // Update existing user
      if (name) user.name = name.trim();
      if (phone) user.phone = phone.trim();
      if (userIsActive !== undefined) user.isActive = Boolean(userIsActive);

      if (newUsername && newUsername !== user.email) {
        user.email = newUsername;
        client.email = newUsername;
      }

      if (portalPassword && portalPassword.trim()) {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(portalPassword.trim(), salt);
        user.defaultPassword = portalPassword.trim();
      }

      if (Array.isArray(assignedProjectIds)) {
        user.assignedProjects = assignedProjectIds;
      }

      await user.save();
    }

    await client.save();

    // Link/unlink projects
    if (Array.isArray(assignedProjectIds)) {
      // Unlink removed projects
      await Project.updateMany(
        { clientId: client._id, _id: { $nin: assignedProjectIds } },
        { $unset: { clientId: 1 } }
      );
      // Link selected projects
      if (assignedProjectIds.length > 0) {
        await Project.updateMany(
          { _id: { $in: assignedProjectIds } },
          { clientId: client._id }
        );
      }
    }

    res.json({
      success: true,
      message: 'Client profile and portal credentials updated successfully',
      client,
      portalCredentials: {
        username: user.email,
        password: user.defaultPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a client profile (only if no active projects linked)
 */
export const deleteClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const projectCount = await Project.countDocuments({ clientId: id });

    if (projectCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete client profile. There are ${projectCount} active project workspace(s) linked to this client. Unlink or reassign them first.`,
      });
      return;
    }

    const client = await Client.findByIdAndDelete(id);
    if (!client) {
      res.status(404).json({ success: false, message: 'Client profile not found' });
      return;
    }

    // Remove client user account
    await User.deleteMany({ clientId: id });

    res.json({ success: true, message: 'Client profile deleted successfully' });
  } catch (error) {
    next(error);
  }
};
