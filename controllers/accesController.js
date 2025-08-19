import prisma from '../config/prisma.js';
import { logger } from '../config/logger.js';

//  Médecin fait une demande d’accès avec le codePatient
export const demanderAcces = async (req, res) => {
  try {
    const { codePatient } = req.body;
    const medecin = req.user;

    if (medecin.role !== 'MEDECIN') {
      return res.status(403).json({ message: "Seuls les médecins peuvent faire une demande d'accès." });
    }

    // Trouver le patient via le codePatient
    const patient = await prisma.utilisateur.findUnique({ where: { codePatient } });
    if (!patient) {
      return res.status(404).json({ message: "Patient introuvable." });
    }

    // Vérifier si une demande existe déjà
    const exist = await prisma.demandeAcces.findFirst({
      where: { patientId: patient.id, medecinId: medecin.id, statut: 'EN_ATTENTE' }
    });
    if (exist) {
      return res.status(400).json({ message: "Une demande est déjà en attente." });
    }

    // Créer la demande
    const demande = await prisma.demandeAcces.create({
      data: {
        medecinId: medecin.id,
        patientId: patient.id
      }
    });

    logger.info(`Demande d'accès créée par ${medecin.nom} ${medecin.prenom} pour patient ${patient.nom} ${patient.prenom}`);
    res.status(201).json({
      ...demande,
      medecin: {
        id: medecin.id,
        nom: medecin.nom,
        prenom: medecin.prenom,
        numeroLicence: medecin.numeroLicence,
        email: medecin.email
      },
      patient: {
        id: patient.id,
        nom: patient.nom,
        prenom: patient.prenom,
        codePatient: patient.codePatient,
        email: patient.email
      }
    });

  } catch (err) {
    logger.error("Erreur demanderAcces", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

//  Patient accepte ou refuse une demande
export const repondreDemande = async (req, res) => {
  try {
    const { demandeId } = req.params;
    const { decision } = req.body; // "ACCEPTEE" ou "REFUSEE"
    const patient = req.user;

    if (patient.role !== 'PATIENT') {
      return res.status(403).json({ message: "Seuls les patients peuvent répondre aux demandes." });
    }

    const demande = await prisma.demandeAcces.findUnique({ where: { id: demandeId } });
    if (!demande || demande.patientId !== patient.id) {
      return res.status(404).json({ message: "Demande introuvable." });
    }

    if (decision !== "ACCEPTEE" && decision !== "REFUSEE") {
      return res.status(400).json({ message: "Décision invalide." });
    }

    // Mettre à jour la demande
    const updated = await prisma.demandeAcces.update({
      where: { id: demandeId },
      data: { statut: decision }
    });

    // Si accepté → donner accès à tous les dossiers du patient
    if (decision === "ACCEPTEE") {
      const dossiers = await prisma.dossier.findMany({ where: { patientId: patient.id } });

      for (const dossier of dossiers) {
        await prisma.dossierAutorisation.upsert({
          where: { dossierId_medecinId: { dossierId: dossier.id, medecinId: demande.medecinId } },
          update: {},
          create: {
            dossierId: dossier.id,
            medecinId: demande.medecinId,
            autorisePar: patient.id
          }
        });
      }
    }

    const medecin = await prisma.utilisateur.findUnique({ where: { id: demande.medecinId } });

    logger.info(`Patient ${patient.nom} ${patient.prenom} a ${decision} la demande ${demandeId}`);
    res.json({
      ...updated,
      medecin: {
        id: medecin.id,
        nom: medecin.nom,
        prenom: medecin.prenom,
        numeroLicence: medecin.numeroLicence,
        email: medecin.email
      },
      patient: {
        id: patient.id,
        nom: patient.nom,
        prenom: patient.prenom,
        codePatient: patient.codePatient,
        email: patient.email
      }
    });

  } catch (err) {
    logger.error("Erreur repondreDemande", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// Patient révoque un médecin
export const revoquerAcces = async (req, res) => {
  try {
    const { nom, prenom, numeroLicence } = req.body;
    const patient = req.user;

    if (patient.role !== 'PATIENT') {
      return res.status(403).json({ message: "Seuls les patients peuvent révoquer des accès." });
    }

    // Trouver le médecin avec les trois critères
    const medecin = await prisma.utilisateur.findFirst({
      where: {
        nom,
        prenom,
        numeroLicence
      }
    });

    if (!medecin) {
      return res.status(404).json({ message: "Médecin introuvable." });
    }

    // Supprimer toutes ses autorisations
    await prisma.dossierAutorisation.deleteMany({
      where: { autorisePar: patient.id, medecinId: medecin.id }
    });

    logger.info(`Patient ${patient.nom} ${patient.prenom} a révoqué les accès du médecin ${medecin.nom} ${medecin.prenom}`);
    res.json({ message: "Accès révoqué avec succès." });

  } catch (err) {
    logger.error("Erreur revoquerAcces", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};


// Lister les médecins autorisés par patient
export const listeAcces = async (req, res) => {
  try {
    const patient = req.user;

    if (patient.role !== 'PATIENT') {
      return res.status(403).json({ message: "Seuls les patients peuvent consulter la liste des accès." });
    }

    const autorisations = await prisma.dossierAutorisation.findMany({
      where: { autorisePar: patient.id },
      include: { medecin: true, dossier: true }
    });

    res.json(autorisations);

  } catch (err) {
    logger.error("Erreur listeAcces", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
