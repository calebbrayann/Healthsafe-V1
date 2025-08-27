import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const authMiddleware = async (req, res, next) => {
  let token;

  // Essayer de récupérer le token depuis les cookies d'abord
  if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
    console.log('Token récupéré depuis les cookies');
  } 
  //Fallback: essayer le header Authorization (pour Postman/tests)
  else if (req.headers.authorization) {
    token = req.headers.authorization.split(' ')[1];
    console.log(' Token récupéré depuis le header Authorization');
  }

  // Si aucun token trouvé
  if (!token) {
    console.log(' Aucun token trouvé (ni cookie ni header)');
    return res.status(401).json({ message: 'Token manquant.' });
  }

  try {
    //  Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token décodé:', { userId: decoded.userId, role: decoded.role });

    //  Récupérer l'utilisateur
    const user = await prisma.utilisateur.findUnique({ 
      where: { id: decoded.userId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        verifie: true,
        codePatient: true,
        specialite: true,
        hopital: true
      }
    });

    if (!user) {
      console.log(' Utilisateur introuvable avec ID:', decoded.userId);
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }

    if (!user.verifie) {
      console.log(' Utilisateur non vérifié:', user.email);
      return res.status(401).json({ message: 'Compte non vérifié.' });
    }

    //Attacher l'utilisateur à la requête
    req.user = user;
    console.log(' Utilisateur attaché:', { id: user.id, role: user.role });
    
    next();
  } catch (err) {
    console.log(' Erreur validation token:', err.message);
    
    // Si le token est expiré, retourner une erreur spécifique
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré.' });
    }
    
    return res.status(401).json({ message: 'Token invalide.' });
  }
};