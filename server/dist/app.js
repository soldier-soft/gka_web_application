"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const authRoutes_1 = __importDefault(require("./modules/auth/authRoutes"));
const crmRoutes_1 = __importDefault(require("./modules/crm/crmRoutes"));
const projectRoutes_1 = __importDefault(require("./modules/projects/projectRoutes"));
const portfolioRoutes_1 = __importDefault(require("./modules/portfolio/portfolioRoutes"));
const portfolioController_1 = require("./modules/portfolio/portfolioController");
const quotationRoutes_1 = __importDefault(require("./modules/quotations/quotationRoutes"));
const siteOpsRoutes_1 = __importDefault(require("./modules/siteOps/siteOpsRoutes"));
const inventoryRoutes_1 = __importDefault(require("./modules/inventory/inventoryRoutes"));
const financeRoutes_1 = __importDefault(require("./modules/finance/financeRoutes"));
const clientPortalRoutes_1 = __importDefault(require("./modules/clientPortal/clientPortalRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const createApp = () => {
    const app = (0, express_1.default)();
    // Security & Utility Middleware
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
    app.use((0, cors_1.default)({ origin: true, credentials: true }));
    app.use((0, morgan_1.default)('dev'));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Static uploads
    app.use('/uploads', express_1.default.static(path_1.default.resolve(__dirname, '../uploads')));
    // Health check
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'healthy',
            app: 'GKA Construction ERP API',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        });
    });
    // REST API v1 Routing
    const apiRouter = express_1.default.Router();
    apiRouter.use('/auth', authRoutes_1.default);
    apiRouter.use('/crm', crmRoutes_1.default);
    apiRouter.use('/projects', projectRoutes_1.default);
    apiRouter.use('/portfolio', portfolioRoutes_1.default);
    apiRouter.get('/project-ideas', portfolioController_1.getProjectIdeas);
    apiRouter.get('/project-ideas/:slug', portfolioController_1.getProjectIdeaBySlug);
    apiRouter.post('/enquiries', portfolioController_1.createPublicEnquiry);
    apiRouter.use('/quotations', quotationRoutes_1.default);
    apiRouter.use('/site-ops', siteOpsRoutes_1.default);
    apiRouter.use('/inventory', inventoryRoutes_1.default);
    apiRouter.use('/finance', financeRoutes_1.default);
    apiRouter.use('/client-portal', clientPortalRoutes_1.default);
    app.use('/api/v1', apiRouter);
    // Serve frontend build in production or if client/dist exists
    const clientDistCandidates = [
        path_1.default.resolve(__dirname, '../../client/dist'),
        path_1.default.resolve(__dirname, '../client/dist'),
        path_1.default.resolve(process.cwd(), '../client/dist'),
        path_1.default.resolve(process.cwd(), 'client/dist'),
    ];
    const resolvedDist = clientDistCandidates.find((cand) => fs_1.default.existsSync(cand));
    if (resolvedDist) {
        app.use(express_1.default.static(resolvedDist));
        app.get('*', (req, res, next) => {
            if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
                return next();
            }
            res.sendFile(path_1.default.join(resolvedDist, 'index.html'));
        });
    }
    // Centralized Error Handler
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
