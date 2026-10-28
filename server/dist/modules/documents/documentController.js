"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocument = exports.updateDocument = exports.createDocument = exports.getDocumentById = exports.getDocuments = void 0;
const Document_1 = require("../../models/Document");
const getDocuments = async (req, res, next) => {
    try {
        const { projectId, category, visibleToClient } = req.query;
        const filter = {};
        if (projectId)
            filter.projectId = projectId;
        if (category)
            filter.category = category;
        if (visibleToClient !== undefined)
            filter.visibleToClient = visibleToClient === 'true';
        const documents = await Document_1.ProjectDocument.find(filter)
            .populate('projectId', 'projectId title siteAddress')
            .populate('uploadedBy', 'name role email')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            count: documents.length,
            documents,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDocuments = getDocuments;
const getDocumentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const document = await Document_1.ProjectDocument.findById(id)
            .populate('projectId', 'projectId title siteAddress')
            .populate('uploadedBy', 'name role email');
        if (!document) {
            res.status(404).json({ success: false, message: 'Document not found' });
            return;
        }
        res.json({ success: true, document });
    }
    catch (error) {
        next(error);
    }
};
exports.getDocumentById = getDocumentById;
const createDocument = async (req, res, next) => {
    try {
        const { title, fileName, fileSize, fileType, category, fileUrl, projectId, visibleToClient, version, } = req.body;
        const uploadedBy = req.user?._id || req.user?.id;
        const document = await Document_1.ProjectDocument.create({
            title: title || 'Untitled Document',
            fileName: fileName || `${(title || 'Document').replace(/\s+/g, '_')}.pdf`,
            fileSize: fileSize || 1024000,
            fileType: fileType || 'application/pdf',
            category: category || 'contracts',
            fileUrl: fileUrl || '/uploads/sample_document.pdf',
            projectId: projectId || undefined,
            uploadedBy,
            visibleToClient: Boolean(visibleToClient),
            version: Number(version) || 1,
        });
        const populated = await Document_1.ProjectDocument.findById(document._id)
            .populate('projectId', 'projectId title')
            .populate('uploadedBy', 'name role');
        res.status(201).json({
            success: true,
            message: 'Document created successfully',
            document: populated,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createDocument = createDocument;
const updateDocument = async (req, res, next) => {
    try {
        const { id } = req.params;
        const document = await Document_1.ProjectDocument.findById(id);
        if (!document) {
            res.status(404).json({ success: false, message: 'Document not found' });
            return;
        }
        const { title, fileName, fileSize, fileType, category, fileUrl, projectId, visibleToClient, version, } = req.body;
        if (title !== undefined)
            document.title = title;
        if (fileName !== undefined)
            document.fileName = fileName;
        if (fileSize !== undefined)
            document.fileSize = Number(fileSize);
        if (fileType !== undefined)
            document.fileType = fileType;
        if (category !== undefined)
            document.category = category;
        if (fileUrl !== undefined)
            document.fileUrl = fileUrl;
        if (projectId !== undefined)
            document.projectId = projectId || undefined;
        if (visibleToClient !== undefined)
            document.visibleToClient = Boolean(visibleToClient);
        if (version !== undefined)
            document.version = Number(version);
        await document.save();
        const populated = await Document_1.ProjectDocument.findById(document._id)
            .populate('projectId', 'projectId title')
            .populate('uploadedBy', 'name role');
        res.json({
            success: true,
            message: 'Document updated successfully',
            document: populated,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateDocument = updateDocument;
const deleteDocument = async (req, res, next) => {
    try {
        const { id } = req.params;
        const document = await Document_1.ProjectDocument.findByIdAndDelete(id);
        if (!document) {
            res.status(404).json({ success: false, message: 'Document not found' });
            return;
        }
        res.json({ success: true, message: 'Document deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteDocument = deleteDocument;
