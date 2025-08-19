import prisma from "../config/prisma.js";
import { logger } from "../config/logger.js";

// Création d’un dossier médical (Médecin)
export async function createDossier(req, res) {
  try {
    // Vérifier que l'utilisateur est bien un médecin
    if (req.user.role !== "MEDECIN") {
      logger.warn("Utilisateur non autorisé à créer un dossier", req.user);
      return res.status(403).json({
        message: "Accès interdit. Seuls les médecins peuvent créer un dossier.",
      });
    }

    const { nom, prenom, codePatient, titre, contenu } = req.body;
    const medecinId = req.user.id; // Récupéré via JWT

    // Vérification des champs obligatoires
    if (!nom || !prenom || !codePatient || !titre || !contenu) {
      logger.warn("Champs manquants pour créer dossier", req.user);
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    // Vérifier si le patient existe
    const patient = await prisma.utilisateur.findFirst({
      where: {
        codePatient,
        nom: nom,
        prenom: prenom,
        role: "PATIENT",
      },
    });

    if (!patient) {
      logger.warn(
        `Patient introuvable: ${nom} ${prenom} (${codePatient})`,
        req.user
      );
      return res.status(404).json({ message: "Patient introuvable." });
    }

    // Générer un numéro de dossier unique pour le patient
    const count = await prisma.dossier.count({
      where: { patientId: patient.id },
    });
    const numeroDossier = `DOS-${(count + 1).toString().padStart(2, "0")}`;

    // Créer le dossier
    const dossier = await prisma.dossier.create({
      data: {
        titre,
        contenu,
        numeroDossier,
        patient: { connect: { id: patient.id } },
        medecin: { connect: { id: medecinId } },
      },
    });

    logger.info(`Dossier créé: ${dossier.numeroDossier}`, req.user);
    return res.status(201).json({ message: "Dossier créé.", dossier });
  } catch (err) {
    logger.error("Erreur createDossier", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", error: err.message });
  }
}

// Lecture d’un dossier avec historique
export async function getDossier(req, res) {
  try {
    const dossier = req.dossier;

    // Enregistrer l'accès dans l'historique
    await prisma.historiqueAcces.create({
      data: {
        dossierId: dossier.id,
        utilisateurId: req.user.id,
      },
    });

    logger.info(`Dossier consulté: ${dossier.numeroDossier}`, req.user);
    return res.json({ dossier });
  } catch (err) {
    logger.error("Erreur getDossier", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}

// Mise à jour d’un dossier (Médecin uniquement)
export async function updateDossier(req, res) {
  try {
    const dossier = req.dossier;
    const { titre, contenu } = req.body;

    if (dossier.medecinId !== req.user.id) {
      logger.warn(
        `Médecin non autorisé à mettre à jour le dossier: ${dossier.numeroDossier}`,
        req.user
      );
      return res.status(403).json({ message: "Non autorisé." });
    }

    const updatedDossier = await prisma.dossier.update({
      where: { id: dossier.id },
      data: {
        titre: titre || dossier.titre,
        contenu: contenu || dossier.contenu,
      },
    });

    logger.info(
      `Dossier mis à jour: ${updatedDossier.numeroDossier}`,
      req.user
    );
    return res.json({
      message: "Dossier mis à jour.",
      dossier: updatedDossier,
    });
  } catch (err) {
    logger.error("Erreur updateDossier", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", error: err.message });
  }
}

// Historique d’un dossier
export async function getDossierHistorique(req, res) {
  try {
    const dossier = req.dossier;

    // Récupérer l'historique avec les infos de l'utilisateur
    const historique = await prisma.historiqueAcces.findMany({
      where: { dossierId: dossier.id },
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            role: true,
          },
        },
      },
      orderBy: { dateAcces: "desc" }, // affichage du plus récent au plus ancien
    });

    // Formater pour Postman
    const formattedHistorique = historique.map((h) => ({
      id: h.id,
      dateAcces: h.dateAcces,
      utilisateur: {
        id: h.utilisateur.id,
        nom: h.utilisateur.nom,
        prenom: h.utilisateur.prenom,
        role: h.utilisateur.role,
      },
    }));

    logger.info(
      `Historique récupéré pour dossier: ${dossier.numeroDossier}`,
      req.user
    );
    return res.json({ historique: formattedHistorique });
  } catch (err) {
    logger.error("Erreur getDossierHistorique", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}

// Liste des dossiers d’un patient
export async function getPatientDossiers(req, res) {
  try {
    const { nom, prenom, codePatient } = req.body;

    const patient = await prisma.utilisateur.findFirst({
      where: {
        nom: nom,
        prenom: prenom,
        codePatient,
        role: "PATIENT",
      },
    });

    if (!patient) {
      logger.warn(
        `Patient introuvable pour liste dossiers: ${nom} ${prenom} (${codePatient})`,
        req.user
      );
      return res.status(404).json({ message: "Patient introuvable." });
    }

    const dossiers = await prisma.dossier.findMany({
      where: { patientId: patient.id },
      include: { medecin: true },
    });

    logger.info(`Dossiers récupérés pour patient: ${patient.id}`, req.user);
    return res.json({ dossiers });
  } catch (err) {
    logger.error("Erreur getPatientDossiers", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", error: err.message });
  }
}

export async function autoriserMedecin(req, res) {
  const { nom, prenom, numeroLicence } = req.body;
  const dossier = req.dossier;
  const donneurId = req.user.id;

  // Vérification des droits d'autorisation
  if (donneurId !== dossier.medecinId && donneurId !== dossier.patientId) {
    return res
      .status(403)
      .json({ message: "Non autorisé à accorder l’accès." });
  }

  // Recherche du médecin cible
  const medecin = await prisma.utilisateur.findFirst({
    where: {
      nom: nom?.trim(),
      prenom: prenom?.trim(),
      numeroLicence: numeroLicence?.trim(),
      role: "MEDECIN",
    },
  });

  if (!medecin) {
    return res
      .status(400)
      .json({ message: "Médecin cible introuvable ou invalide." });
  }

  // Création de l'autorisation avec gestion du doublon
  try {
    await prisma.dossierAutorisation.create({
      data: {
        dossierId: dossier.id,
        medecinId: medecin.id,
        autorisePar: donneurId,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ message: "Ce médecin a déjà accès à ce dossier." });
    }
    throw error;
  }

  // Log d’audit
  await prisma.auditLog.create({
    data: {
      action: "AUTORISATION_MEDECIN",
      utilisateurId: donneurId,
      cibleId: medecin.id,
      meta: {
        dossierId: dossier.id,
        nom: medecin.nom,
        prenom: medecin.prenom,
        numeroLicence: medecin.numeroLicence,
      },
    },
  });

  return res.status(200).json({ message: "Accès accordé au médecin." });
}

// Upload de fichier dans un dossier
export const uploadFichier = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Aucun fichier envoyé" });

    res
      .status(200)
      .json({ message: "Fichier uploadé avec succès", file: req.file });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur lors de l’upload", error: err.message });
  }
};

export async function listerAutorisationsParNumero(req, res) {
  console.log(" Route atteinte :", req.params.numeroDossier);
  const { numeroDossier } = req.params;

  const dossier = await prisma.dossier.findUnique({
    where: { numeroDossier },
  });

  if (!dossier) {
    return res.status(404).json({ message: "Dossier introuvable." });
  }

  const autorisations = await prisma.dossierAutorisation.findMany({
    where: { dossierId: dossier.id },
    include: {
      medecin: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          numeroLicence: true,
          email: true,
        },
      },
    },
  });

  return res.status(200).json({ autorisations });
}
