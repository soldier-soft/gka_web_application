"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePublishReport = exports.createSiteReport = exports.getSiteReports = void 0;
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
