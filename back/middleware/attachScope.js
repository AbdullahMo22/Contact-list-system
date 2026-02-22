const userModel = require('../models/userModels');
const asyncHandler = require('express-async-handler');

exports.attachScope = asyncHandler(async (req, res, next) => {
    // If admin, no scope restrictions
    if (req.user.isAdmin) {
        req.scope = null;
        return next();
    }
    
    // Get user scope from database
    const scope = await userModel.getUserScope(req.user.id);
    req.scope = scope;
    
    console.log(`[attachScope] user=${req.user.id} scope=`, JSON.stringify(scope));

    next();
});