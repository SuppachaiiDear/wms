require('dotenv').config();

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
    try {
        const bearerHeader = req.headers.authorization;

        if (!bearerHeader) {
            return res.status(401).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (!bearerHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authorization format'
            });
        }

        const token = bearerHeader.split(' ')[1];

        const decoded = jwt.verify(token, SECRET);

        req.user = decoded;

        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            });
        }

        next();
    };
};

module.exports = {
    verifyToken,
    authorize
};