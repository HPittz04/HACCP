import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import session from 'express-session';
import { env } from './config/env';
import { logger } from './config/logger';
import { authMiddleware } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error';
import authRoutes from './routes/auth';
import assetsRoutes from './routes/assets';
import roundTemplatesRoutes from './routes/roundTemplates';
import roundsRoutes from './routes/rounds';
import measurementsRoutes from './routes/measurements';
import correctiveActionsRoutes from './routes/correctiveActions';
import syncRoutes from './routes/sync';
import reportsRoutes from './routes/reports';
import usersRoutes from './routes/users';

const app = express();

const viewsPath = path.join(process.cwd(), 'src', 'views');
const publicPath = path.join(process.cwd(), 'src', 'public');
app.set('view engine', 'ejs');
app.set('views', viewsPath);
app.use(express.static(publicPath));

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' }
  })
);
app.use(pinoHttp({ logger }));
app.use(authMiddleware);

app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: 'Too many requests'
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/round-templates', roundTemplatesRoutes);
app.use('/api/rounds', roundsRoutes);
app.use('/api/measurements', measurementsRoutes);
app.use('/api/corrective-actions', correctiveActionsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/reports', reportsRoutes);

// dashboard placeholders
app.get('/', (_req, res) => res.redirect('/dashboard/rounds'));
app.get('/dashboard/rounds', (_req, res) => res.render('dashboard/rounds', { title: 'Rondas do dia' }));
app.get('/dashboard/rounds/:id', (_req, res) => res.render('dashboard/round_detail', { title: 'Detalhe da ronda' }));
app.get('/dashboard/measurements', (_req, res) => res.render('dashboard/measurements', { title: 'Medidas recentes' }));
app.get('/dashboard/assets', (_req, res) => res.render('dashboard/assets', { title: 'Assets' }));
app.get('/dashboard/users', (_req, res) => res.render('dashboard/users', { title: 'Utilizadores' }));
app.get('/dashboard/reports', (_req, res) => res.render('dashboard/reports', { title: 'Relatórios' }));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
