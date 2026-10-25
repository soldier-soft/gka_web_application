import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

import authRoutes from './modules/auth/authRoutes';
import crmRoutes from './modules/crm/crmRoutes';
import projectRoutes from './modules/projects/projectRoutes';
import portfolioRoutes from './modules/portfolio/portfolioRoutes';
import {
  getProjectIdeas,
  getProjectIdeaBySlug,
  createPublicEnquiry,
} from './modules/portfolio/portfolioController';
import quotationRoutes from './modules/quotations/quotationRoutes';
import siteOpsRoutes from './modules/siteOps/siteOpsRoutes';
import inventoryRoutes from './modules/inventory/inventoryRoutes';
import financeRoutes from './modules/finance/financeRoutes';
import clientPortalRoutes from './modules/clientPortal/clientPortalRoutes';
import { errorHandler } from './middleware/errorHandler';

export const createApp = (): express.Application => {
  const app = express();

  // Security & Utility Middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use((_req, res, next) => {
    // Override browser unrecognized feature warnings (attribution-reporting, private-aggregation, etc.)
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()');
    next();
  });
  app.use(cors({ origin: true, credentials: true }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

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
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), 'dist'),
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../../dist'),
    path.resolve(__dirname, '../client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    process.cwd(),
  ];
  const resolvedDist = clientDistCandidates.find(
    (cand) => fs.existsSync(cand) && fs.existsSync(path.join(cand, 'index.html'))
  );

  // Discover and serve all existing static asset directories
  const candidateAssetDirs = [
    resolvedDist ? path.join(resolvedDist, 'assets') : null,
    path.resolve(process.cwd(), 'assets'),
    path.resolve(process.cwd(), 'dist/assets'),
    path.resolve(process.cwd(), 'client/dist/assets'),
    path.resolve(__dirname, '../../assets'),
    path.resolve(__dirname, '../../dist/assets'),
    path.resolve(__dirname, '../../client/dist/assets'),
  ].filter((dir): dir is string => !!dir && fs.existsSync(dir));

  const uniqueAssetDirs = Array.from(new Set(candidateAssetDirs));

  uniqueAssetDirs.forEach((dir) => {
    console.log(`[Frontend] Serving static bundle assets from: ${dir}`);
    app.use(
      '/assets',
      express.static(dir, {
        maxAge: '1y',
        immutable: true,
      })
    );
  });

  // Discover and serve root static files (favicon, logo.png, robots.txt, sitemap.xml)
  const candidateStaticRoots = [
    resolvedDist,
    path.resolve(process.cwd(), 'dist'),
    path.resolve(process.cwd(), 'client/dist'),
    process.cwd(),
    path.resolve(__dirname, '../..'),
  ].filter((dir): dir is string => !!dir && fs.existsSync(dir));

  Array.from(new Set(candidateStaticRoots)).forEach((dir) => {
    app.use(
      express.static(dir, {
        maxAge: '1h',
        index: false,
      })
    );
  });

  // REST API v1 Routing
  const apiRouter = express.Router();
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/crm', crmRoutes);
  apiRouter.use('/projects', projectRoutes);
  apiRouter.use('/portfolio', portfolioRoutes);
  apiRouter.get('/project-ideas', getProjectIdeas);
  apiRouter.get('/project-ideas/:slug', getProjectIdeaBySlug);
  apiRouter.post('/enquiries', createPublicEnquiry);
  apiRouter.use('/quotations', quotationRoutes);
  apiRouter.use('/site-ops', siteOpsRoutes);
  apiRouter.use('/inventory', inventoryRoutes);
  apiRouter.use('/finance', financeRoutes);
  apiRouter.use('/client-portal', clientPortalRoutes);

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
    if (
      req.path.startsWith('/assets/') ||
      /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json|txt|xml|pdf)$/i.test(req.path)
    ) {
      return res.status(404).type('text/plain').send('Resource not found');
    }

    // 3. Find and serve index.html
    const indexCandidates = [
      resolvedDist ? path.join(resolvedDist, 'index.html') : null,
      path.resolve(process.cwd(), 'index.html'),
      path.resolve(process.cwd(), 'dist/index.html'),
      path.resolve(process.cwd(), 'client/dist/index.html'),
      path.resolve(__dirname, '../../index.html'),
      path.resolve(__dirname, '../../dist/index.html'),
      path.resolve(__dirname, '../../client/dist/index.html'),
    ].filter((f): f is string => !!f && fs.existsSync(f));

    if (indexCandidates.length > 0) {
      return res.sendFile(indexCandidates[0]);
    }

    res.status(404).type('text/plain').send('Application index.html not found');
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

