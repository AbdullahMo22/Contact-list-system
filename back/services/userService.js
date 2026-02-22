const userModel=require('../models/userModels');
const ApiError=require('../utils/apiError');
const bcrypt=require('bcrypt');

exports.createUser = async (username, email, password, fullName, userAdd) => {
  const existingUser = await userModel.findUserByUsername(username);
  if (existingUser) throw new ApiError("Username already exists", 400);

  const passwordHash = await bcrypt.hash(password, 10);

  return userModel.createUser({
    username,
    email,
    passwordHash,
    fullName,
    userAdd,
  });
};
exports.updateUser=async (userId,username,email,password,fullName,userUpdate)=>{
    const existingUser=await userModel.findUserById(userId);
    if(!existingUser) throw new ApiError('User not found',404);
    let passwordHash;
    if(password) {
        passwordHash = await bcrypt.hash(password, 10);
    }   
    await userModel.updateUser(userId,username,email,passwordHash,fullName,userUpdate);
    return userId;
}
exports.deleteUser=async (userId,userDelete)=>{
    const existingUser=await userModel.findUserById(userId);
    if(!existingUser) throw new ApiError('User not found',404); 
    await userModel.deleteUser(userId,userDelete);
    return userId;
}
exports.getAllUsers=async ()=>{
    const users=await userModel.getAllUsers();
    return users;
}
exports.getUserById=async (userId)=>{
    const user=await userModel.findUserById(userId);
    if(!user) throw new ApiError('User not found',404); 
    return user;
}
exports.getUserByUsername=async (username)=>{
    const user=await userModel.findUserByUsername(username);
    if(!user) throw new ApiError('User not found',404); 
    return user;
}

exports.disableUser = async (userId, userUpdate) => {
  await userModel.toggleUserrActive(userId, userUpdate);
     return userModel.getUserById(userId);
};

exports.getUserScope = async (userId) => {
  const user = await userModel.findUserById(userId);
  if (!user) throw new ApiError('User not found', 404);
  return userModel.getUserScope(userId);
};

exports.updateUserScope = async (userId, hotelIds, departmentIds, hotelDeptPairs) => {
    const user = await userModel.findUserById(userId);
    if (!user) throw new ApiError('User not found', 404);
    return userModel.updateUserScope(userId, hotelIds, departmentIds, hotelDeptPairs);
};
