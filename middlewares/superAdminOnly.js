export const superAdminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Accès refusé : Super Admin uniquement' });
  }
  next();
};
