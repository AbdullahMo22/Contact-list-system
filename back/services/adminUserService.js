const userModel = require('../models/userModels');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
exports.getUsers = async (filters = {}) => {
    const { page = 1, limit = 20, status, search } = filters;
    const offset = (page - 1) * limit;
    
    const users = await userModel.getUsers({ status, search, limit, offset });
    const totalCount = await userModel.getUsersCount({ status, search });
    
    return {
        users,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            limit
        }
    };
}

exports.createUser = async (userData, adminId) => {
    const { username, email, password, full_name, hotelIds, departmentIds } = userData;
    
    if (!username || !email || !password) {
        throw new ApiError('Missing required fields', 400);
    }
    
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
        throw new ApiError('Email already exists', 409);
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const userId = await userModel.createUser({
        username,
        email,
        password: hashedPassword,
        full_name,
        userAdd: adminId
    });
    
    // Set scope if provided
    if (hotelIds || departmentIds) {
        await userModel.updateUserScope(userId, hotelIds, departmentIds);
    }
    
    const createdUser = await userModel.getUserById(userId);
    return createdUser;
}

exports.updateUser = async (userId, userData, adminId) => {
    const { username, email, full_name, phone, is_active, hotelIds, departmentIds } = userData;
    
    if (!userId) {
        throw new ApiError('User ID is required', 400);
    }
    
    const existingUser = await userModel.getUserById(userId);
    if (!existingUser) {
        throw new ApiError('User not found', 404);
    }
    
    if (email && email !== existingUser.email) {
        const emailExists = await userModel.getUserByEmail(email);
        if (emailExists) {
            throw new ApiError('Email already exists', 409);
        }
    }
    
    const updateData = {
        username,
        email,
        full_name,
        phone,
        is_active,
        userUpdate: adminId
    };
    
    const isUpdated = await userModel.updateUser(userId, updateData);
    if (!isUpdated) {
        throw new ApiError('No changes made', 400);
    }
    
    // Update scope if provided
    if (hotelIds !== undefined || departmentIds !== undefined) {
        await userModel.updateUserScope(userId, hotelIds, departmentIds);
    }
    
    const updatedUser = await userModel.getUserById(userId);
    return updatedUser;
}

exports.deleteUser = async (userId, adminId) => {
    if (!userId || !adminId) {
        throw new ApiError('Missing required fields', 400);
    }
    
    const existingUser = await userModel.getUserById(userId);
    if (!existingUser) {
        throw new ApiError('User not found', 404);
    }
    
    const isDeleted = await userModel.deleteUser(userId, adminId);
    if (!isDeleted) {
        throw new ApiError('User not found', 404);
    }
    
    return true;
}

exports.resetUserPassword = async (userId, newPassword, adminId) => {
    if (!userId || !newPassword || !adminId) {
        throw new ApiError('Missing required fields', 400);
    }
    
    const existingUser = await userModel.getUserById(userId);
    if (!existingUser) {
        throw new ApiError('User not found', 404);
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const isUpdated = await userModel.updateUserPassword(userId, hashedPassword);
    
    if (!isUpdated) {
        throw new ApiError('Failed to update password', 500);
    }
    
    return true;
}

// Get user with roles and scope
exports.getUserById = async (userId) => {
    const user = await userModel.getUserById(userId);
    if (!user) {
        throw new ApiError('User not found', 404);
    }
    
    // Get roles and scope separately
    const roles = await userModel.getUserRoles(userId);
    const scope = await userModel.getUserScope(userId);
    
    return {
        ...user,
        roles,
        scope
    };
};

