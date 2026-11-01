"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quotationController_1 = require("./quotationController");
const auth_1 = require("../../middleware/auth");
const roleCheck_1 = require("../../middleware/roleCheck");
const router = (0, express_1.Router)();
// Allow public or authenticated rate library lookup
router.get('/rates/library', quotationController_1.getRateLibrary);
// PDF and DOCX downloads (supports query param token and direct quotation link)
router.get('/:id/pdf', auth_1.optionalAuthenticate, quotationController_1.downloadQuotationPDF);
router.get('/:id/docx', auth_1.optionalAuthenticate, quotationController_1.downloadQuotationDOCX);
router.use(auth_1.authenticate);
router.get('/', quotationController_1.getQuotations);
router.get('/:id', quotationController_1.getQuotationById);
router.post('/', (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), quotationController_1.createQuotation);
router.put('/:id', (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), quotationController_1.updateQuotation);
router.patch('/:id', (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), quotationController_1.updateQuotation);
router.post('/:id/approve', (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), quotationController_1.approveQuotation);
router.post('/:id/convert-to-invoice', (0, roleCheck_1.requireRoles)('super_admin', 'project_manager', 'accounts'), quotationController_1.convertToInvoice);
router.delete('/:id', (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), quotationController_1.deleteQuotation);
router.post('/:id/restore', (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), quotationController_1.restoreQuotation);
router.delete('/:id/permanent', (0, roleCheck_1.requireRoles)('super_admin'), quotationController_1.permanentDeleteQuotation);
exports.default = router;
