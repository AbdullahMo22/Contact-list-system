const pool=require('../config/db');
 
const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');
const asynchandler=require('express-async-handler');
const authService=require('../services/authService');
const userModel=require('../models/userModels');
const saltRounds=10;

exports.registerAdmin=asynchandler(async (req, res) => {
const {username,password,full_name}=req.body;

const hashed=await bcrypt.hash(password,saltRounds);
const [result]=await pool.query("insert into users(username,password_hash,full_name,role) values(?,?,?,'admin')"
    ,[username,hashed,full_name]);
    res.status(201).json({message:'Admin registered successfully',id:result.insertId});

});
exports.updatePassword=asynchandler(async (req, res) => {
    const {id}=req.params;
const {password,}=req.body;
if(!password) return res.status(400).json({message:'Password is required'});
console.log("id",id,"password",password);
const hashed=await bcrypt.hash(password,saltRounds);
console.log("hashed",hashed);
const [result]=await pool.query("update users set password_hash=? where user_id=?"
    ,[hashed,id]);
    res.status(200).json({message:'Password updated successfully',id:id});

});

 
exports.login=asynchandler(async(req,res)=>{
    const {username,password}=req.body;
    const user=await authService.login(username,password);
    const token=jwt.sign({userId:user.user_id,username:user.username}
        ,process.env.JWT_SECRET_KEY,{expiresIn:process.env.JWT_EXPIRES_IN});
    res.json({message:'Login successful',token});
}
);
 
// controller.js
exports.GetAuditLogs = asynchandler(async (req, res) => {
  const { page, limit, q } = req.query;
  const result = await authService.GetAuditLogs({ page, limit, q });
  res.json(result);
});

exports.getMe=asynchandler(async(req,res)=>{
    // req.user is set by protect middleware and contains id (user_id)
    const userId = req.user.id || req.user.user_id;
    const user = await userModel.getUserWithRolesNested(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
});