import express from 'express';
import {
  registerPatient,
  registerMedecin,
  login,
  verifyEmail,
  requestResetPassword,
  resetPassword,
  logout,
  resetCodePatient,
  me,
  refresh
} from '../controllers/authController.js';

import { validateAndSanitize } from '../middlewares/validateAndSanitize.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validateLogin } from '../middlewares/validateLogin.js';

const router = express.Router();

// Test de chargement du routeur
console.log('authRoutes chargé');

// Connexion
router.post('/login', validateLogin, login);

// Déconnexion
router.post('/logout', authMiddleware, logout);

router.get("/me", me);

// Inscription patient
router.post('/register-patient', validateAndSanitize, registerPatient);

// Inscription médecin
router.post('/register-medecin', registerMedecin);

// Vérification d’email
router.get('/verify/:token', verifyEmail);

// Demande de réinitialisation de mot de passe
router.post('/request-reset-password', requestResetPassword);

// Réinitialisation de mot de passe
router.post('/reset-password/:token', resetPassword);

// Réinitialisation du code patient
router.post('/reset-code-patient', authMiddleware, resetCodePatient);

// Endpoint pour rafraîchir le token
router.post("/refresh", authMiddleware, refresh);


export default router;
