"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const siteOpsController_1 = require("./siteOpsController");
const auth_1 = require("../../middleware/auth");
const roleCheck_1 = require("../../middleware/roleCheck");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max photo size
});
router.use(auth_1.authenticate);
router.get('/reports', siteOpsController_1.getSiteReports);
router.post('/reports', (0, roleCheck_1.requireRoles)('super_admin', 'project_manager', 'site_supervisor'), siteOpsController_1.createSiteReport);
router.patch('/reports/:id/publish', (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), siteOpsController_1.togglePublishReport);
// Direct upload photo endpoint for Site Diary with automatic Google Drive project folder sync
router.post('/upload-photo', (0, roleCheck_1.requireRoles)('super_admin', 'project_manager', 'site_supervisor'), upload.single('photo'), siteOpsController_1.uploadSitePhoto);
exports.default = router;
