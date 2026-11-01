"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSitePhoto = exports.togglePublishReport = exports.createSiteReport = exports.getSiteReports = void 0;
const SiteReport_1 = require("../../models/SiteReport");
const getSiteReports = async (req, res, next) => {
    try {
        const { projectId } = req.query;
        const filter = {};
        if (projectId)
            filter.projectId = projectId;
        if (req.user?.role === 'client') {
            filter.isPublishedToClient = true;
        }
        const reports = await SiteReport_1.SiteReport.find(filter)
            .populate('projectId', 'title projectId')
            .populate('supervisorId', 'name email phone')
            .sort({ reportDate: -1 });
        res.json({ success: true, count: reports.length, reports });
    }
    catch (error) {
        next(error);
    }
};
exports.getSiteReports = getSiteReports;
const createSiteReport = async (req, res, next) => {
    try {
        const { projectId, reportDate, weatherCondition, workCompletedSummary, milestoneId, milestoneTitle, labourCount, materialsConsumedSummary, issuesOrDelays, safetyObservations, photos, isPublishedToClient, } = req.body;
        const totalLabour = (Number(labourCount?.masons) || 0) +
            (Number(labourCount?.helpers) || 0) +
            (Number(labourCount?.carpenters) || 0) +
            (Number(labourCount?.plumbers) || 0) +
            (Number(labourCount?.electricians) || 0) +
            (Number(labourCount?.painters) || 0) +
            (Number(labourCount?.supervisors) || 1);
        const report = await SiteReport_1.SiteReport.create({
            projectId,
            reportDate: new Date(reportDate || Date.now()),
            weatherCondition: weatherCondition || 'sunny',
            workCompletedSummary,
            milestoneId,
            milestoneTitle,
            labourCount: {
                masons: Number(labourCount?.masons) || 0,
                helpers: Number(labourCount?.helpers) || 0,
                carpenters: Number(labourCount?.carpenters) || 0,
                plumbers: Number(labourCount?.plumbers) || 0,
                electricians: Number(labourCount?.electricians) || 0,
                painters: Number(labourCount?.painters) || 0,
                supervisors: Number(labourCount?.supervisors) || 1,
                totalCount: totalLabour,
            },
            materialsConsumedSummary,
            issuesOrDelays,
            safetyObservations,
            photos: photos || [],
            isPublishedToClient: Boolean(isPublishedToClient),
            publishedAt: isPublishedToClient ? new Date() : undefined,
            supervisorId: req.user?.id,
        });
        res.status(201).json({ success: true, report });
    }
    catch (error) {
        next(error);
    }
};
exports.createSiteReport = createSiteReport;
const togglePublishReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        const report = await SiteReport_1.SiteReport.findById(id);
        if (!report) {
            res.status(404).json({ success: false, message: 'Site report not found' });
            return;
        }
        report.isPublishedToClient = !report.isPublishedToClient;
        report.publishedAt = report.isPublishedToClient ? new Date() : undefined;
        await report.save();
        res.json({
            success: true,
            message: report.isPublishedToClient ? 'Report published to client portal.' : 'Report unpublished from client portal.',
            report,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.togglePublishReport = togglePublishReport;
const uploadSitePhoto = async (req, res, next) => {
    try {
        const { projectId, caption, category, imageBase64, fileName: customFileName } = req.body;
        let fileBuffer = null;
        let fileName = customFileName || `site_photo_${Date.now()}.jpg`;
        if (req.file) {
            fileBuffer = req.file.buffer;
            fileName = req.file.originalname || fileName;
        }
        else if (imageBase64) {
            const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                fileBuffer = Buffer.from(matches[2], 'base64');
            }
            else {
                fileBuffer = Buffer.from(imageBase64, 'base64');
            }
        }
        if (!fileBuffer) {
            res.status(400).json({ success: false, message: 'No photo file or image data provided.' });
            return;
        }
        const { GoogleDriveService } = await Promise.resolve().then(() => __importStar(require('../../services/googleDriveService')));
        const syncResult = await GoogleDriveService.syncSiteDiaryPhoto(projectId, fileName, fileBuffer, caption, category);
        res.status(201).json({
            success: true,
            url: syncResult.fileUrl,
            fileName: syncResult.fileName,
            caption: caption || '',
            category: category || 'site_condition',
            folderUrl: syncResult.folderUrl,
            driveSubfolder: syncResult.driveSubfolder,
            driveNote: syncResult.driveNote,
            message: syncResult.message,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadSitePhoto = uploadSitePhoto;
