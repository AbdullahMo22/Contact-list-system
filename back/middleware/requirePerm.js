const ApiError=require('../utils/apiError');

exports.requirePerm=(...permKeys)=>(req,res,next)=>{
    const userPerms=req.user?.permissions ||[];
    const ok=permKeys.some(k=>userPerms.includes(k));
    if(!ok)return next(new ApiError('Forbidden,insufficient permissions',403));
    next();
};