import prisma from '../config/prisma.js';
import { envoyerEmail } from '../config/nodemailer.js';


// SUPER_ADMIN : Promouvoir un Médecin en Admin d’Hôpital
export const promouvoirMedecinEnAdmin = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: "Accès refusé : seul le SUPER_ADMIN peut promouvoir un médecin." });
    }

    const { nom, prenom, numeroLicence, hopital } = req.body;

    if (!hopital) return res.status(400).json({ message: "Le nom de l'hôpital est requis." });
    if (!nom || !prenom || !numeroLicence) {
      return res.status(400).json({ message: "Nom, prénom et numéro de licence du médecin requis." });
    }

    // Rechercher le médecin par nom + prénom + numéroLicence + hopital
    const medecin = await prisma.utilisateur.findFirst({
      where: { nom, prenom, numeroLicence, hopital, role: 'MEDECIN' }
    });

    if (!medecin) return res.status(404).json({ message: 'Médecin introuvable.' });

    const updatedUser = await prisma.utilisateur.update({
      where: { id: medecin.id },
      data: { role: 'ADMIN_HOPITAL', verifie: false }
    });

    res.status(200).json({
      message: 'Médecin promu à Admin d’hôpital. En attente de validation du Super Admin.',
      admin: updatedUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// SUPER_ADMIN : Valider un Admin d’Hôpital
export const validerAdminHopital = async (req, res) => {
  try {
    if (req.user?.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Accès interdit. Réservé au SUPER_ADMIN." });
    }

    const { nom, prenom, numeroLicence, hopital } = req.body;
    if (!nom || !prenom || !numeroLicence || !hopital) {
      return res.status(400).json({ message: "Nom, prénom, numéro de licence et hopital requis." });
    }

    // Rechercher l’admin par nom + prénom + numéroLicence + hopital
    const admin = await prisma.utilisateur.findFirst({
      where: { nom, prenom, numeroLicence, hopital, role: "ADMIN_HOPITAL" }
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin introuvable." });
    }

    const updatedAdmin = await prisma.utilisateur.update({
      where: { id: admin.id },
      data: { verifie: true }
    });

    res.status(200).json({
      message: "Admin d’hôpital validé avec succès.",
      admin: updatedAdmin
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};



// ADMIN_HOPITAL : Valider un médecin
export async function validerMedecin(req, res) {
  try {
    const { nom, prenom } = req.body;

    // Vérifier le rôle de l'utilisateur
    if (req.user.role !== 'ADMIN_HOPITAL') {
      return res.status(403).json({ message: 'Non autorisé.' });
    }

    if (!nom || !prenom) {
      return res.status(400).json({ message: 'Nom et prénom sont requis.' });
    }

    // Vérifier que le médecin existe ET qu'il appartient au même hôpital que l'admin
    const medecin = await prisma.utilisateur.findFirst({
      where: { 
        nom, 
        prenom, 
        role: 'MEDECIN',
        hopital: req.user.hopital  // contrôle sur l’hôpital
      }
    });

    if (!medecin) {
      return res.status(404).json({ message: 'Médecin introuvable dans votre hôpital.' });
    }

    // Valider le médecin
    const medecinValide = await prisma.utilisateur.update({
      where: { id: medecin.id },
      data: { verifie: true }
    });

    // Envoi email au médecin
    try {
      await envoyerEmail('compteValideMedecin', medecinValide.email, {
        nom: medecinValide.nom,
        specialite: medecinValide.specialite,
        hopital: medecinValide.hopital
      });
    } catch (err) {
      console.error('Erreur email médecin:', err.message);
    }

    // Envoi email à l'admin
    try {
      await envoyerEmail('notificationAdmin', process.env.EMAIL_ADMIN, {
        nom: medecinValide.nom,
        email: medecinValide.email
      });
    } catch (err) {
      console.error('Erreur email admin:', err.message);
    }

    // Réponse finale
    return res.status(200).json({ message: 'Médecin validé avec succès.', medecin: medecinValide });

  } catch (error) {
    console.error('Erreur validerMedecin:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}


//ADMIN_HOPITAL : Liste des médecins de son hôpital
export const getMedecins = async (req, res) => {
  try {
    const hopital = req.user.hopital;

    const medecins = await prisma.utilisateur.findMany({
      where: { role: 'MEDECIN', hopital }
    });

    res.json({ medecins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

export const searchMedecins = async (req, res) => {
  try {
    const { email, numeroLicence, nom, hopital } = req.query;

    // Construire le filtre principal sous forme de tableau
    const filters = [{ role: "MEDECIN" }];

    if (email) filters.push({ email });
    if (numeroLicence) filters.push({ numeroLicence });
    if (hopital) filters.push({ hopital });

    // Recherche sur nom OU prénom
    if (nom) {
      filters.push({
        OR: [
          { nom: { contains: nom, mode: "insensitive" } },
          { prenom: { contains: nom, mode: "insensitive" } }
        ]
      });
    }

    const medecins = await prisma.utilisateur.findMany({
      where: {
        AND: filters
      }
    });

    res.json({ medecins });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


export const revoquerAdmin = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email de l’admin requis." });
  }

  try {
    const admin = await prisma.utilisateur.findUnique({
      where: { email }
    });

    if (!admin || admin.role !== "ADMIN_HOPITAL") {
      return res.status(404).json({ message: "Admin d’hôpital introuvable ou déjà révoqué." });
    }

    // Révocation du rôle et désactivation du compte
    await prisma.utilisateur.update({
      where: { email },
      data: {
        role: "REVOQUE",
        actif: false
      }
    });

    // Retirer les accès des dossiers et consultations
    await prisma.consultation.updateMany({
      where: { adminId: admin.id },
      data: { adminId: null }
    });

    await prisma.dossier.updateMany({
      where: { adminId: admin.id },
      data: { adminId: null }
    });

    // Créer un log de révocation
    await prisma.suppressionLog.create({
      data: {
        utilisateurId: admin.id,
        suppriméPar: req.user.id, // Super admin qui effectue la révocation
        raison: "Compte admin révoqué et désactivé",
        date: new Date()
      }
    });

    res.status(200).json({ message: "Admin révoqué et désactivé avec succès." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};

// ADMIN_HOPITAL : Supprimer un médecin
export const supprimerMedecin = async (req, res) => {
  const { nom, prenom, email } = req.body; // Identifier le médecin via l'email
  const hopital = req.user.hopital;

  if (!email) {
    return res.status(400).json({ message: "Email du médecin requis." });
  }

  try {
    // Vérifier que le médecin existe et appartient à l'hôpital de l'admin
    const medecin = await prisma.utilisateur.findFirst({
      where: { email, role: 'MEDECIN', hopital }
    });

    console.log("Médecin trouvé :", medecin);

    if (!medecin) {
      console.warn("Aucun médecin trouvé avec cet email ou hors de l'hôpital :", email);
      return res.status(404).json({ message: "Médecin introuvable ou hors de votre hôpital." });
    }

    console.log("Révocation en cours pour :", medecin.email);

    // Révoquer le médecin
    await prisma.utilisateur.update({
      where: { id: medecin.id },
      data: { role: 'REVOQUE', actif: false }
    });

    console.log("Médecin révoqué :", medecin.id);

    // Déconnecter le médecin de ses dossiers et consultations
    await prisma.consultation.updateMany({
      where: { medecinId: medecin.id },
      data: { medecinId: null }
    });

    console.log("Consultations dissociées du médecin :", medecin.id);

    await prisma.dossier.updateMany({
      where: { medecinId: medecin.id },
      data: { medecinId: null }
    });

    console.log("Dossiers dissociés du médecin :", medecin.id);

    // Créer un log pour la traçabilité
    await prisma.suppressionLog.create({
      data: {
        utilisateurId: medecin.id,
        suppriméPar: req.user.id,
        raison: "Révocation du compte médecin",
        date: new Date()
      }
    });

    console.log("Log de suppression créé pour :", medecin.email);

    // Notification par email au médecin
    try {
      await envoyerEmail('medecinRevoque', medecin.email, {
        nom: medecin.nom,
        prenom: medecin.prenom,
        hopital
      });
      console.log("Email envoyé au médecin :", medecin.email);
    } catch (err) {
      console.error('Erreur envoi email médecin:', err.message);
    }

    // Notification par email à l'admin
    try {
      await envoyerEmail('notificationAdmin', process.env.EMAIL_ADMIN, {
        nom: medecin.nom,
        prenom: medecin.prenom,
        hopital
      });
      console.log("Email envoyé à l'admin pour révocation de :", medecin.email);
    } catch (err) {
      console.error('Erreur envoi email admin:', err.message);
    }

    res.status(200).json({ message: "Médecin révoqué avec succès. Les dossiers sont conservés et notifications envoyées." });

  } catch (err) {
    console.error("Erreur serveur lors de la suppression du médecin :", err);
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};

export async function getUtilisateurs(req, res) {
  try {
    const { role, actif } = req.query;

    // Conversion explicite du paramètre actif en booléen
    const isActif = actif === "true" ? true : actif === "false" ? false : undefined;

    const whereClause = {};

    if (role) whereClause.role = role;
    if (isActif !== undefined) whereClause.actif = isActif;

    const utilisateurs = await prisma.utilisateur.findMany({
      where: whereClause,
      select: {
        id: true,
        nom: true,
        prenom: true,
        numeroLicence: role === "MEDECIN" ? true : false,
        codePatient: role === "PATIENT" ? true : false,
        actif: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(utilisateurs);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
}


// Réactivation d’un utilisateur
export async function reactiverUtilisateur(req, res) {
  try {
    const { id } = req.params;

    const utilisateur = await prisma.utilisateur.update({
      where: { id: parseInt(id) },
      data: { actif: true },
    });

    res.status(200).json({
      message: "Utilisateur réactivé avec succès.",
      utilisateur,
    });
  } catch (error) {
    console.error("Erreur lors de la réactivation :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

export async function getLogs(req, res) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' }, // Utilise le bon champ de date
      include: {
        utilisateur: {
          select: { nom: true, prenom: true, email: true, role: true },
        },
      },
    });

      res.status(200).json(logs);
    } catch (error) {
      console.error("Erreur lors de la récupération des logs :", error);
      res.status(500).json({ message: "Erreur serveur." });
    }
  }