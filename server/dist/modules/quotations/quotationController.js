"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuotation = exports.convertToInvoice = exports.downloadQuotationDOCX = exports.downloadQuotationPDF = exports.approveQuotation = exports.createQuotation = exports.getQuotationById = exports.getQuotations = exports.getRateLibrary = void 0;
const fs_1 = __importDefault(require("fs"));
const Quotation_1 = require("../../models/Quotation");
const Project_1 = require("../../models/Project");
const Invoice_1 = require("../../models/Invoice");
const Client_1 = require("../../models/Client");
const User_1 = require("../../models/User");
const constants_1 = require("../../shared/constants");
const pdfService_1 = require("../../services/pdfService");
const docxService_1 = require("../../services/docxService");
const getRateLibrary = async (req, res) => {
    res.json({ success: true, rates: constants_1.STANDARD_RATE_LIBRARY });
};
exports.getRateLibrary = getRateLibrary;
const getQuotations = async (req, res, next) => {
    try {
        const { projectId, clientId, status } = req.query;
        const filter = {};
        if (projectId)
            filter.projectId = projectId;
        if (clientId)
            filter.clientId = clientId;
        if (status)
            filter.status = status;
        // For clients, restrict to their client ID
        if (req.user?.role === 'client' && req.user.clientId) {
            filter.clientId = req.user.clientId;
            filter.status = { $in: ['sent', 'approved', 'revised'] }; // Drafts hidden from client
        }
        const quotations = await Quotation_1.Quotation.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, count: quotations.length, quotations });
    }
    catch (error) {
        next(error);
    }
};
exports.getQuotations = getQuotations;
const getQuotationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const quotation = await Quotation_1.Quotation.findById(id);
        if (!quotation) {
            res.status(404).json({ success: false, message: 'Quotation not found' });
            return;
        }
        if (req.user?.role === 'client' && req.user.clientId && quotation.clientId.toString() !== req.user.clientId) {
            res.status(403).json({ success: false, message: 'Forbidden. Access not permitted.' });
            return;
        }
        res.json({ success: true, quotation });
    }
    catch (error) {
        next(error);
    }
};
exports.getQuotationById = getQuotationById;
const createQuotation = async (req, res, next) => {
    try {
        const { projectId, leadId, clientId, clientName, clientAddress, projectTitle, siteLocation, items, discountPaise, isNegotiated, negotiatedDiscountPaise, negotiatedNotes, taxRatePercent, termsAndConditions, validDays, } = req.body;
        // Calculate subtotal from items with integer paise accuracy
        let subtotalPaise = 0;
        const calculatedItems = (items || []).map((item, idx) => {
            const qty = Number(item.quantity) || 0;
            const rate = Number(item.unitRatePaise) || 0;
            const amountPaise = Math.round(qty * rate);
            subtotalPaise += amountPaise;
            return {
                id: item.id || `item-${idx + 1}`,
                category: item.category || 'civil',
                description: item.description,
                unit: item.unit || 'sq.ft',
                quantity: qty,
                unitRatePaise: rate,
                amountPaise,
                materialCostPaise: item.materialCostPaise || 0,
                labourCostPaise: item.labourCostPaise || 0,
                equipmentCostPaise: item.equipmentCostPaise || 0,
                notes: item.notes,
            };
        });
        const isNeg = Boolean(isNegotiated);
        const disc = isNeg ? (Number(negotiatedDiscountPaise) || Number(discountPaise) || 0) : (Number(discountPaise) || 0);
        const taxableAmountPaise = Math.max(0, subtotalPaise - disc);
        const taxRate = Number(taxRatePercent) || 18;
        const totalTaxPaise = Math.round((taxableAmountPaise * taxRate) / 100);
        const cgstPaise = Math.round(totalTaxPaise / 2);
        const sgstPaise = totalTaxPaise - cgstPaise;
        const totalAmountPaise = taxableAmountPaise + totalTaxPaise;
        const count = await Quotation_1.Quotation.countDocuments();
        const currentYear = new Date().getFullYear();
        const quotationNumber = `GKA-QUO-${currentYear}-${String(count + 1).padStart(3, '0')}`;
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + (Number(validDays) || 30));
        const quotation = await Quotation_1.Quotation.create({
            quotationNumber,
            projectId,
            leadId,
            clientId,
            clientName,
            clientAddress: clientAddress || '',
            projectTitle,
            siteLocation,
            items: calculatedItems,
            subtotalPaise,
            discountPaise: disc,
            isNegotiated: isNeg,
            negotiatedDiscountPaise: isNeg ? disc : 0,
            negotiatedNotes: isNeg ? (negotiatedNotes || '') : '',
            cgstPaise,
            sgstPaise,
            igstPaise: 0,
            taxRatePercent: taxRate,
            totalAmountPaise,
            termsAndConditions: termsAndConditions || [
                '50% advance upon agreement signing and site mobilization.',
                '40% progressive billing upon milestone completion (Foundation, Structure, Plastering).',
                '10% upon final testing, inspection and keys handover.',
                'Rates valid for 30 calendar days from the date of quotation.',
            ],
            revisionNumber: 1,
            status: 'draft',
            validUntil,
        });
        res.status(201).json({ success: true, quotation });
    }
    catch (error) {
        next(error);
    }
};
exports.createQuotation = createQuotation;
const approveQuotation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const quotation = await Quotation_1.Quotation.findById(id);
        if (!quotation) {
            res.status(404).json({ success: false, message: 'Quotation not found' });
            return;
        }
        quotation.status = 'approved';
        quotation.approvedAt = new Date();
        quotation.approvedBy = req.user?.id;
        await quotation.save();
        // If quotation is linked to a project, update project contract value & budget!
        if (quotation.projectId) {
            await Project_1.Project.findByIdAndUpdate(quotation.projectId, {
                contractValuePaise: quotation.totalAmountPaise,
                totalBudgetPaise: quotation.subtotalPaise, // baseline execution budget
            });
            quotation.convertedToBudget = true;
            await quotation.save();
        }
        res.json({
            success: true,
            message: 'Quotation approved successfully and project budget initialized.',
            quotation,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.approveQuotation = approveQuotation;
const downloadQuotationPDF = async (req, res, next) => {
    try {
        const { id } = req.params;
        const quotation = await Quotation_1.Quotation.findById(id);
        if (!quotation) {
            res.status(404).json({ success: false, message: 'Quotation not found' });
            return;
        }
        let clientPortalUsername = 'client@gingerhotel.com';
        let clientPortalPassword = 'GKAclient2026!';
        if (quotation.clientId) {
            const client = await Client_1.Client.findById(quotation.clientId);
            if (client?.email) {
                clientPortalUsername = client.email.toLowerCase();
                const clientUser = await User_1.User.findOne({ email: client.email.toLowerCase() });
                if (clientUser?.defaultPassword) {
                    clientPortalPassword = clientUser.defaultPassword;
                }
            }
        }
        quotation.clientPortalUsername = clientPortalUsername;
        quotation.clientPortalPassword = clientPortalPassword;
        const docStream = pdfService_1.PDFService.generateQuotationPDF(quotation);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${quotation.quotationNumber}.pdf"`);
        docStream.pipe(res);
    }
    catch (error) {
        next(error);
    }
};
exports.downloadQuotationPDF = downloadQuotationPDF;
const downloadQuotationDOCX = async (req, res, next) => {
    try {
        const { id } = req.params;
        const quotation = await Quotation_1.Quotation.findById(id);
        if (!quotation) {
            res.status(404).json({ success: false, message: 'Quotation not found' });
            return;
        }
        const docxPath = await docxService_1.DOCXService.generateQuotationDocx(quotation);
        res.download(docxPath, `GKA_Quotation_${quotation.quotationNumber}.docx`, (err) => {
            try {
                if (fs_1.default.existsSync(docxPath))
                    fs_1.default.unlinkSync(docxPath);
            }
            catch (_) { }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.downloadQuotationDOCX = downloadQuotationDOCX;
const convertToInvoice = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { partialItemIndices, dueDate } = req.body;
        const quotation = await Quotation_1.Quotation.findById(id);
        if (!quotation) {
            res.status(404).json({ success: false, message: 'Quotation not found' });
            return;
        }
        if (quotation.status !== 'approved') {
            res.status(400).json({ success: false, message: 'Only approved quotations can be converted to an invoice.' });
            return;
        }
        if (!quotation.projectId) {
            res.status(400).json({ success: false, message: 'Quotation must be linked to an active project before converting to invoice.' });
            return;
        }
        const project = await Project_1.Project.findById(quotation.projectId);
        if (!project) {
            res.status(404).json({ success: false, message: 'Linked project not found.' });
            return;
        }
        const itemsToConvert = partialItemIndices && Array.isArray(partialItemIndices) && partialItemIndices.length > 0
            ? quotation.items.filter((_, idx) => partialItemIndices.includes(idx))
            : quotation.items;
        let subtotalPaise = 0;
        const invoiceItems = itemsToConvert.map((item) => {
            subtotalPaise += item.amountPaise;
            return {
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPricePaise: item.unitRatePaise,
                totalPaise: item.amountPaise,
            };
        });
        const isNegotiated = Boolean(quotation.isNegotiated);
        const negotiatedDiscountPaise = isNegotiated
            ? (quotation.negotiatedDiscountPaise || quotation.discountPaise || 0)
            : 0;
        const negotiatedNotes = isNegotiated ? (quotation.negotiatedNotes || '') : '';
        const taxablePaise = Math.max(0, subtotalPaise - negotiatedDiscountPaise);
        const taxRate = quotation.taxRatePercent || 18;
        const taxPaise = Math.round((taxablePaise * taxRate) / 100);
        const cgstPaise = Math.round(taxPaise / 2);
        const sgstPaise = taxPaise - cgstPaise;
        const totalAmountPaise = taxablePaise + taxPaise;
        const count = await Invoice_1.Invoice.countDocuments();
        const currentYear = new Date().getFullYear();
        const invoiceNumber = `GKA-INV-${currentYear}-${String(count + 1).padStart(3, '0')}`;
        const invoiceTerms = [...constants_1.DEFAULT_INVOICE_TERMS];
        if (isNegotiated && negotiatedNotes) {
            invoiceTerms.push(`Agreed Special Terms: ${negotiatedNotes}`);
        }
        const invoice = await Invoice_1.Invoice.create({
            invoiceNumber,
            projectId: project._id,
            projectTitle: project.title,
            clientId: quotation.clientId || project.clientId,
            clientName: quotation.clientName,
            clientContactPerson: quotation.clientContactPerson,
            clientCompany: quotation.clientCompany,
            billingAddress: quotation.clientAddress || project.siteAddress.street,
            subject: `Tax Invoice for Construction Works - ${project.title}`,
            items: invoiceItems,
            subtotalPaise,
            isNegotiated,
            negotiatedDiscountPaise,
            discountPaise: negotiatedDiscountPaise,
            negotiatedNotes,
            termsAndConditions: invoiceTerms,
            cgstPaise,
            sgstPaise,
            igstPaise: 0,
            totalAmountPaise,
            paidAmountPaise: 0,
            dueAmountPaise: totalAmountPaise,
            issueDate: new Date(),
            dueDate: new Date(dueDate || Date.now() + 14 * 86400000),
            status: 'issued',
            notes: quotation.notes || (isNegotiated && negotiatedNotes ? `Agreed Special Settlement: ${negotiatedNotes}` : `Converted from Approved Quotation ${quotation.quotationNumber}.`),
        });
        // Update project invoiced amount
        project.invoicedAmountPaise += totalAmountPaise;
        await project.save();
        res.status(201).json({
            success: true,
            message: `Quotation ${quotation.quotationNumber} successfully converted to Tax Invoice ${invoice.invoiceNumber}.`,
            invoice,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.convertToInvoice = convertToInvoice;
const updateQuotation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const quotation = await Quotation_1.Quotation.findById(id);
        if (!quotation) {
            res.status(404).json({ success: false, message: 'Quotation not found' });
            return;
        }
        const { quotationNumber, clientName, clientCompany, clientContactPerson, clientAddress, clientEmail, clientPhone, projectTitle, siteLocation, subject, senderName, senderCompany, items, discountPaise, isNegotiated, negotiatedDiscountPaise, negotiatedNotes, taxRatePercent, termsAndConditions, status, validUntil, } = req.body;
        if (items && Array.isArray(items)) {
            let subtotalPaise = 0;
            const calculatedItems = items.map((item, idx) => {
                const qty = Number(item.quantity) || 0;
                const rate = Number(item.unitRatePaise) || 0;
                const amountPaise = Math.round(qty * rate);
                subtotalPaise += amountPaise;
                return {
                    id: item.id || `item-${idx + 1}`,
                    category: item.category || 'civil',
                    description: item.description,
                    unit: item.unit || 'sq.ft',
                    quantity: qty,
                    unitRatePaise: rate,
                    amountPaise,
                    materialCostPaise: item.materialCostPaise || 0,
                    labourCostPaise: item.labourCostPaise || 0,
                    equipmentCostPaise: item.equipmentCostPaise || 0,
                    notes: item.notes,
                };
            });
            quotation.items = calculatedItems;
            quotation.subtotalPaise = subtotalPaise;
        }
        const isNeg = isNegotiated !== undefined ? Boolean(isNegotiated) : Boolean(quotation.isNegotiated);
        quotation.isNegotiated = isNeg;
        let disc = 0;
        if (isNeg) {
            disc = negotiatedDiscountPaise !== undefined
                ? Number(negotiatedDiscountPaise)
                : (discountPaise !== undefined ? Number(discountPaise) : (quotation.negotiatedDiscountPaise || quotation.discountPaise || 0));
            quotation.negotiatedDiscountPaise = disc;
            quotation.discountPaise = disc;
            if (negotiatedNotes !== undefined)
                quotation.negotiatedNotes = negotiatedNotes;
        }
        else {
            disc = discountPaise !== undefined ? Number(discountPaise) : (quotation.discountPaise || 0);
            quotation.discountPaise = disc;
            quotation.negotiatedDiscountPaise = 0;
            quotation.negotiatedNotes = '';
        }
        const taxableAmountPaise = Math.max(0, quotation.subtotalPaise - disc);
        const taxRate = taxRatePercent !== undefined ? Number(taxRatePercent) : (quotation.taxRatePercent || 18);
        quotation.taxRatePercent = taxRate;
        const totalTaxPaise = Math.round((taxableAmountPaise * taxRate) / 100);
        quotation.cgstPaise = Math.round(totalTaxPaise / 2);
        quotation.sgstPaise = totalTaxPaise - quotation.cgstPaise;
        quotation.igstPaise = 0;
        quotation.totalAmountPaise = taxableAmountPaise + totalTaxPaise;
        if (quotationNumber)
            quotation.quotationNumber = quotationNumber;
        if (clientName)
            quotation.clientName = clientName;
        if (clientCompany !== undefined)
            quotation.clientCompany = clientCompany;
        if (clientContactPerson !== undefined)
            quotation.clientContactPerson = clientContactPerson;
        if (clientAddress !== undefined)
            quotation.clientAddress = clientAddress;
        if (clientEmail !== undefined)
            quotation.clientEmail = clientEmail;
        if (clientPhone !== undefined)
            quotation.clientPhone = clientPhone;
        if (projectTitle)
            quotation.projectTitle = projectTitle;
        if (siteLocation !== undefined)
            quotation.siteLocation = siteLocation;
        if (subject !== undefined)
            quotation.subject = subject;
        if (senderName !== undefined)
            quotation.senderName = senderName;
        if (senderCompany !== undefined)
            quotation.senderCompany = senderCompany;
        if (status !== undefined)
            quotation.status = status;
        if (validUntil)
            quotation.validUntil = new Date(validUntil);
        if (req.body.projectId !== undefined) {
            quotation.projectId = req.body.projectId || undefined;
            if (req.body.projectId) {
                const proj = await Project_1.Project.findById(req.body.projectId);
                if (proj) {
                    quotation.projectTitle = proj.title;
                    if (proj.siteAddress) {
                        quotation.siteLocation = `${proj.siteAddress.street || ''}, ${proj.siteAddress.city || ''}`.trim().replace(/^,/, '');
                    }
                }
            }
        }
        await quotation.save();
        res.json({ success: true, message: 'Quotation updated successfully', quotation });
    }
    catch (error) {
        next(error);
    }
};
exports.updateQuotation = updateQuotation;
