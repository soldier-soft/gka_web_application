"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentController_1 = require("./documentController");
const auth_1 = require("../../middleware/auth");
const roleCheck_1 = require("../../middleware/roleCheck");
const router = (0, express_1.Router)();
// List documents (authenticated staff or client-filtered)
router.get('/', auth_1.authenticate, documentController_1.getDocuments);
router.get('/:id', auth_1.authenticate, documentController_1.getDocumentById);
// Staff creation
router.post('/', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), documentController_1.createDocument);
// Editing & Deletion (Owner / Super Admin)
router.put('/:id', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), documentController_1.updateDocument);
router.patch('/:id', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), documentController_1.updateDocument);
router.delete('/:id', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin'), documentController_1.deleteDocument);
exports.default = router;
