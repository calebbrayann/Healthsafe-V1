// middlewares/roleMiddleware.js

export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: `Accès refusé pour le rôle : ${userRole}` });
    }

    next();
  };
};
