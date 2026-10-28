"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clientController_1 = require("./clientController");
const auth_1 = require("../../middleware/auth");
const roleCheck_1 = require("../../middleware/roleCheck");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Staff lookup routes
router.get('/', (0, roleCheck_1.requireRoles)('super_admin', 'project_manager', 'accounts'), clientController_1.getClients);
router.get('/:id', (0, roleCheck_1.requireRoles)('super_admin', 'project_manager', 'accounts'), clientController_1.getClientById);
// Staff creation & modification routes
router.post('/', (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), clientController_1.createClient);
router.put('/:id', (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), clientController_1.updateClient);
router.delete('/:id', (0, roleCheck_1.requireRoles)('super_admin'), clientController_1.deleteClient);
exports.default = router;
