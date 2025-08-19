// routes/dossierRoutes.js
import express from 'express';
import { createDossier, getDossier, updateDossier, getDossierHistorique, getPatientDossiers , autoriserMedecin , uploadFichier, listerAutorisationsParNumero} from '../controllers/dossierController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { dossierAccessMiddleware } from '../middlewares/dossierMiddleware.js';
import multer from 'multer';
import { upload } from '../config/upload.js';

const router = express.Router();


// Endpoint pour upload d’un fichier dans un dossier
router.post('/:numeroDossier/fichiers',authMiddleware,dossierAccessMiddleware,upload.single('file'), // 'file' = nom du champ dans le formulaireuploadFichier
);

//Création d'un dossier par un médecin (nom + prénom + codePatient)
router.post('/', authMiddleware, createDossier);

//Liste des dossiers d’un patient
router.post('/patient', authMiddleware, getPatientDossiers);

// Lister les autorisations d'accès à un dossier
router.get("/numero/:numeroDossier/autorisations", listerAutorisationsParNumero);

//Lecture d’un dossier (patient ou médecin autorisé)
router.get('/:numeroDossier', authMiddleware, dossierAccessMiddleware, getDossier);

//Mise à jour d’un dossier (médecin uniquement)
router.put('/:numeroDossier', authMiddleware, dossierAccessMiddleware, updateDossier);

//Historique d’un dossier
router.get('/:numeroDossier/historique', authMiddleware, dossierAccessMiddleware, getDossierHistorique);

// Autoriser un médecin à accéder au dossier
router.post('/:numeroDossier/autoriser', authMiddleware, dossierAccessMiddleware, autoriserMedecin);



export default router;
