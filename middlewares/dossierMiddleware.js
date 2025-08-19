import prisma from '../config/prisma.js';
import { logger } from '../config/logger.js';

export const dossierAccessMiddleware = async (req, res, next) => {
  const numeroDossier = req.params.numeroDossier;
  const user = req.user;

  try {
    const dossier = await prisma.dossier.findFirst({
      where: { numeroDossier },
      include: { patient: true, medecin: true }
    });

    if (!dossier) {
      logger.warn(`Dossier introuvable: ${numeroDossier}`, user);
      return res.status(404).json({ message: 'Dossier non trouvé.' });
    }

    // Vérification soft delete : seuls les admins peuvent y accéder
    if (dossier.actif === false && user.role !== 'ADMIN') {
      logger.warn(`Dossier soft-deleted inaccessible: ${numeroDossier}`, user);
      return res.status(404).json({ message: 'Dossier non trouvé.' });
    }

    req.dossier = dossier;

    // PATIENT : accès uniquement à ses propres dossiers
    if (user.role === 'PATIENT' && dossier.patientId !== user.id) {
      logger.warn(`Patient non autorisé à accéder au dossier: ${numeroDossier}`, user);
      return res.status(403).json({ message: 'Non autorisé.' });
    }

    // MEDECIN : accès s’il est créateur OU autorisé OU possède le codePatient
    if (user.role === 'MEDECIN') {
      const estCreateur = dossier.medecinId === user.id;

      const autorisation = await prisma.dossierAutorisation.findFirst({
        where: {
          dossierId: dossier.id,
          medecinId: user.id
        }
      });

      const codeFournit = req.body?.codePatient || req.query?.codePatient;
      const codeValide = codeFournit && codeFournit === dossier.patient.codePatient;

      if (!estCreateur && !autorisation && !codeValide) {
        logger.warn(`Médecin non autorisé à accéder au dossier: ${numeroDossier}`, user);
        return res.status(403).json({ message: 'Accès refusé. Autorisation ou code requis.' });
      }
    }

    // ADMIN : accès total
    next();
  } catch (err) {
    logger.error('Erreur dossierAccessMiddleware', err);
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
