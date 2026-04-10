const jwt = require('jsonwebtoken');

function requireJwt(options = {}) {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : '' ;
      
      console.log(`[JWT AUTH] ${req.method} ${req.path}`, { hasToken: !!token, optional: options.optional, adminOnly: options.adminOnly });
      
      if (!token) {
        if (options.optional) {
          console.log(`[JWT AUTH] No token but optional, proceeding`);
          return next();
        }
        console.log(`[JWT AUTH] No token and required, rejecting`);
        return res.status(401).json({ success: false, message: 'No token provided' });
      }

      const secret = process.env.JWT_SECRET || 'dev_secret_key';
      const payload = jwt.verify(token, secret);
      
      console.log(`[JWT AUTH] Token verified, user type:`, payload.userType || payload.type);
      
      if (options.adminOnly && payload.userType !== 'admin' && payload.type !== 'admin' && payload.type !== 'superadmin') {
        console.log(`[JWT AUTH] Not admin user, rejecting`);
        return res.status(403).json({ success: false, message: 'Admin only' });
      }

      req.user = payload;
      console.log(`[JWT AUTH] Auth passed, proceeding`);
      next();
    } catch (err) {
      if (options.optional) {
        console.log(`[JWT AUTH] Token verify failed but optional, proceeding`);
        return next();
      }
      console.log(`[JWT AUTH] Token verify failed:`, err.message);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  };
}

module.exports = {
  requireJwt
};