const jwt = require('jsonwebtoken');
const userModel = require('../models/userModels');
const asyncHandler = require('express-async-handler');

exports.protect = asyncHandler(async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await userModel.getUserWithRoles(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }
        
        // Set consistent user object
        req.user = {
            id: user.user_id,
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            roles: user.roles || [],
            permissions: user.permissions || [],
            isAdmin: user.isAdmin || false
        };
        
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
});