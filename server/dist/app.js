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
const mailRoutes_1 = __importDefault(require("./modules/mail/mailRoutes"));
const documentRoutes_1 = __importDefault(require("./modules/documents/documentRoutes"));
const clientRoutes_1 = __importDefault(require("./modules/clients/clientRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const createApp = () => {
    const app = (0, express_1.default)();
    // Security & Utility Middleware
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
    app.use((_req, res, next) => {
        // Override browser unrecognized feature warnings (attribution-reporting, private-aggregation, etc.)
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()');
        next();
    });
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
    // Discover frontend distribution directory
    const clientDistCandidates = [
        path_1.default.resolve(process.cwd(), 'client/dist'),
        path_1.default.resolve(process.cwd(), 'dist'),
        path_1.default.resolve(__dirname, '../../client/dist'),
        path_1.default.resolve(__dirname, '../../dist'),
        path_1.default.resolve(__dirname, '../client/dist'),
        path_1.default.resolve(process.cwd(), '../client/dist'),
        process.cwd(),
    ];
    const resolvedDist = clientDistCandidates.find((cand) => fs_1.default.existsSync(cand) && fs_1.default.existsSync(path_1.default.join(cand, 'index.html')));
    // Discover and serve all existing static asset directories
    const candidateAssetDirs = [
        resolvedDist ? path_1.default.join(resolvedDist, 'assets') : null,
        path_1.default.resolve(process.cwd(), 'assets'),
        path_1.default.resolve(process.cwd(), 'dist/assets'),
        path_1.default.resolve(process.cwd(), 'client/dist/assets'),
        path_1.default.resolve(__dirname, '../../assets'),
        path_1.default.resolve(__dirname, '../../dist/assets'),
        path_1.default.resolve(__dirname, '../../client/dist/assets'),
    ].filter((dir) => !!dir && fs_1.default.existsSync(dir));
    const uniqueAssetDirs = Array.from(new Set(candidateAssetDirs));
    uniqueAssetDirs.forEach((dir) => {
        console.log(`[Frontend] Serving static bundle assets from: ${dir}`);
        app.use('/assets', express_1.default.static(dir, {
            maxAge: '1y',
            immutable: true,
        }));
    });
    // Discover and serve root static files (favicon, logo.png, robots.txt, sitemap.xml)
    const candidateStaticRoots = [
        resolvedDist,
        path_1.default.resolve(process.cwd(), 'dist'),
        path_1.default.resolve(process.cwd(), 'client/dist'),
        process.cwd(),
        path_1.default.resolve(__dirname, '../..'),
    ].filter((dir) => !!dir && fs_1.default.existsSync(dir));
    Array.from(new Set(candidateStaticRoots)).forEach((dir) => {
        app.use(express_1.default.static(dir, {
            maxAge: '1h',
            index: false,
        }));
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
    apiRouter.use('/mail', mailRoutes_1.default);
    apiRouter.use('/documents', documentRoutes_1.default);
    apiRouter.use('/clients', clientRoutes_1.default);
    app.use('/api/v1', apiRouter);
    // Static Asset 404 Guard: Ensure missing static files return 404, never index.html
    app.use('/assets', (req, res) => {
        res.status(404).type('text/plain').send('Static asset not found');
    });
    // SPA Fallback: Serve index.html strictly for HTML page navigation
    app.get('*', (req, res, next) => {
        // 1. Never intercept API or upload routes
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }
        // 2. Never send HTML fallback for asset extensions
        if (req.path.startsWith('/assets/') ||
            /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json|txt|xml|pdf)$/i.test(req.path)) {
            return res.status(404).type('text/plain').send('Resource not found');
        }
        // 3. Find and serve index.html
        const indexCandidates = [
            resolvedDist ? path_1.default.join(resolvedDist, 'index.html') : null,
            path_1.default.resolve(process.cwd(), 'index.html'),
            path_1.default.resolve(process.cwd(), 'dist/index.html'),
            path_1.default.resolve(process.cwd(), 'client/dist/index.html'),
            path_1.default.resolve(__dirname, '../../index.html'),
            path_1.default.resolve(__dirname, '../../dist/index.html'),
            path_1.default.resolve(__dirname, '../../client/dist/index.html'),
        ].filter((f) => !!f && fs_1.default.existsSync(f));
        if (indexCandidates.length > 0) {
            return res.sendFile(indexCandidates[0]);
        }
        res.status(404).type('text/plain').send('Application index.html not found');
    });
    // Centralized Error Handler
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
