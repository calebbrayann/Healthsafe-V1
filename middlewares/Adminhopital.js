export const adminHopitalMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN_HOPITAL') {
    return res.status(403).json({ message: 'Accès refusé : Admin d’hôpital uniquement' });
  }
  next();
};
