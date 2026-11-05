const jwt = require('jsonwebtoken');

// Reads the "Authorization: Bearer <token>" header, verifies the JWT,
// and attaches the authenticated user's id to the request as req.userId.
function authenticate(req, res, next) {
    const header = req.headers.authorization;
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: 'Missing authentication token' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.userId;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}

module.exports = authenticate;
