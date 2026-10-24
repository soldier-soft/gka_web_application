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

  // Serve frontend build in production or if client/dist exists
  const clientDistCandidates = [
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
  ];
  const resolvedDist = clientDistCandidates.find((cand) => fs.existsSync(cand));

  if (resolvedDist) {
    app.use(express.static(resolvedDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.join(resolvedDist, 'index.html'));
    });
  }

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

