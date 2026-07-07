const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      error: 'Acceso denegado: Se requiere rol de super_admin' 
    });
  }
  next();
};

module.exports = { requireSuperAdmin };
