import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import accesRoutes from './routes/accesRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dossierRoutes from './routes/dossierRoutes.js';

dotenv.config();

const app = express();

// Sécurité globale
app.use(helmet()); // Protections HTTP headers
app.use(cors({ origin: process.env.FRONT_URL, credentials: true })); // CORS
app.use(hpp()); // Empêche pollution des query params

// Parser JSON et formulaire
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Limitation des requêtes globale
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Limitation spécifique pour login/reset
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5, // 5 essais max
  message: "Trop de tentatives, réessayez dans 15 minutes."
});

// Routes
app.use('/api/auth', loginLimiter, authRoutes); // protège login/reset
app.use('/api/admin', adminRoutes);
app.use('/api/dossiers', dossierRoutes);
app.use('/api/acces', accesRoutes);

// Health check
app.get('/', (req, res) => res.send('API HealthSafe welcome OK'));

// Gestion des erreurs globales (catch all)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur serveur.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur port ${PORT}`));
