import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {demanderAcces,repondreDemande,revoquerAcces,listeAcces} from '../controllers/accesController.js';
import { medecinOnly , patientOnly } from '../middlewares/accessMiddleware.js';

const router = express.Router();


// Routes pour la gestion des demandes
router.post('/demander', authMiddleware, medecinOnly, demanderAcces);

// Routes pour la gestion des réponses
router.post('/repondre/:demandeId', authMiddleware, patientOnly, repondreDemande);

// Routes pour la gestion des révocations
router.post('/revoquer', authMiddleware, patientOnly, revoquerAcces);

// Routes pour la gestion des listes
router.get('/liste', authMiddleware, patientOnly, listeAcces);


export default router;
