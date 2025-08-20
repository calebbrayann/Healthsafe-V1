import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';

// Swagger
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';

// Routes
import accesRoutes from './routes/accesRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dossierRoutes from './routes/dossierRoutes.js';

dotenv.config();
const app = express();

// Swagger setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swaggerPath = path.join(__dirname, 'docs', 'swagger.json');
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Sécurité globale
app.use(helmet());
app.use(cors({ origin: process.env.FRONT_URL, credentials: true }));
app.use(hpp());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Limitation spécifique pour login/reset
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Trop de tentatives, réessayez dans 15 minutes."
});

// Routes
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dossiers', dossierRoutes);
app.use('/api/acces', accesRoutes);

// Health check
app.get('/', (req, res) => res.send('API HealthSafe welcome OK'));

// 404
app.use((req, res) => res.status(404).json({ message: 'Route introuvable.' }));

// Erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur serveur.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur port ${PORT}`));

