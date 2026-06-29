const jwt = require('jsonwebtoken');

// Verifies the Bearer token and attaches the decoded user payload to req.user
exports.protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fail fast here instead of letting a malformed token reach Prisma as undefined
    if (!decoded.id) {
      return res.status(401).json({ message: 'Token payload is missing a valid user id' });
    }

    // decoded contains { id, role, iat, exp }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Restricts access to specific roles, e.g. restrictTo('CLUB_ADMIN', 'SUPER_ADMIN')
exports.restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    next();
  };
};