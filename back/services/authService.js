const userModel=require('../models/authModels');
const ApiError=require('../utils/apiError');
const bcrypt=require('bcrypt');
const auditLogModel = require('../models/auditLogModel');


exports.login=async (username,password)=>{
    const user=await userModel.findUserByUsername(username);
    if(!user) throw new ApiError('Invalid credentials user not found',401);
    const isValid=await bcrypt.compare(password,user.password_hash);
    if(!isValid) throw new ApiError('Invalid credentials',401);
    return user;
};

exports.GetAuditLogs = async ({ page, limit, q }) => {
  return auditLogModel.getAuditLogs({ page, limit, q });
};