import express from 'express';
import { 
  validerAdminHopital, 
  validerMedecin, 
  promouvoirMedecinEnAdmin, 
  getMedecins, 
  searchMedecins, 
  revoquerAdmin, 
  supprimerMedecin ,
  getUtilisateurs,
  getLogs,
  reactiverUtilisateur,
} from '../controllers/adminController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { superAdminMiddleware } from '../middlewares/superAdminOnly.js';
import { adminHopitalMiddleware } from '../middlewares/Adminhopital.js'; 
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = express.Router();


// Promouvoir un Médecin en Admin d’Hôpital
router.post('/promouvoir-medecin', authMiddleware, superAdminMiddleware, promouvoirMedecinEnAdmin);

// Valider un Admin d’Hôpital
router.post('/valider-admin', authMiddleware, superAdminMiddleware, validerAdminHopital);

// Supprimer un Admin d’Hôpital
router.delete('/admin-hopital', authMiddleware, superAdminMiddleware, revoquerAdmin);

// Valider un Médecin
router.post('/valider-medecin', authMiddleware, adminHopitalMiddleware, validerMedecin);

// Récupérer la liste des Médecins
router.get('/medecins', authMiddleware, adminHopitalMiddleware, getMedecins);

// Rechercher des Médecins
router.get('/medecins/search', authMiddleware, adminHopitalMiddleware, searchMedecins);

// Supprimer un Médecin
router.delete('/medecins', authMiddleware, adminHopitalMiddleware, supprimerMedecin);

// Récupérer la liste des Utilisateurs
router.get("/utilisateurs",authMiddleware,roleMiddleware(["SUPER_ADMIN", "ADMIN_HOPITAL"]),getUtilisateurs);

// Réactiver un Utilisateur
router.put("/utilisateurs/:id/reactiver",authMiddleware, roleMiddleware(["SUPER_ADMIN", "ADMIN_HOPITAL"]),reactiverUtilisateur);

// Récupérer les logs
router.get("/logs",authMiddleware, roleMiddleware(["SUPER_ADMIN", "ADMIN_HOPITAL"]),getLogs);

export default router;
