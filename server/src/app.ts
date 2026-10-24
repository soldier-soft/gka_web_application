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
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../../dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), 'dist'),
    path.resolve(__dirname, '../client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    process.cwd(),
  ];
  const resolvedDist = clientDistCandidates.find(
    (cand) => fs.existsSync(cand) && fs.existsSync(path.join(cand, 'index.html'))
  );

  // Serve static assets BEFORE API & SPA fallback
  if (resolvedDist) {
    console.log(`[Frontend] Serving static assets from: ${resolvedDist}`);

    const assetsDir = path.join(resolvedDist, 'assets');
    if (fs.existsSync(assetsDir)) {
      // Dedicated route for built Vite bundles (/assets/index-*.js, /assets/index-*.css)
      app.use(
        '/assets',
        express.static(assetsDir, {
          maxAge: '1y',
          immutable: true,
          fallthrough: false, // Never send missing JS/CSS to HTML fallback
        })
      );
    }

    // Serve other root static files (favicon, logo.png, robots.txt, sitemap.xml)
    app.use(
      express.static(resolvedDist, {
        maxAge: '1h',
        index: false,
      })
    );
  } else {
    console.warn('[Frontend] Notice: No pre-compiled index.html found in candidate directories.');
  }

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
  if (resolvedDist) {
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

      // 3. Send index.html for React client-side route navigation
      res.sendFile(path.join(resolvedDist, 'index.html'));
    });
  }

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

