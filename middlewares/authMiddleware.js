import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token manquant.' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.utilisateur.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide.' });
  }
};
