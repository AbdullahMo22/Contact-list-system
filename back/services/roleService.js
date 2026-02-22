const roleModel = require('../models/roleModels');
const userModel = require('../models/userModels');
const permissionModel = require('../models/permissionModels');
const ApiError = require('../utils/apiError');

// Role CRUD
exports.getRoles = async () => {
    return await roleModel.getRoles();
};

exports.getRoleById = async (roleId) => {
    const role = await roleModel.getRoleById(roleId);
    if (!role) {
        throw new ApiError('Role not found', 404);
    }
    return role;
};

exports.createRole = async (role_name, role_description) => {
    if (!role_name) {
        throw new ApiError('Role name is required', 400);
    }
    
    const exists = await roleModel.roleExists(role_name);
    if (exists) {
        throw new ApiError('Role with this name already exists', 409);
    }
    
    const roleId = await roleModel.createRole(role_name, role_description);
    return await roleModel.getRoleById(roleId);
};

exports.updateRole = async (roleId, role_name, role_description) => {
    const existingRole = await roleModel.getRoleById(roleId);
    if (!existingRole) {
        throw new ApiError('Role not found', 404);
    }
    
    if (role_name && role_name !== existingRole.role_name) {
        const exists = await roleModel.roleExists(role_name, roleId);
        if (exists) {
            throw new ApiError('Role with this name already exists', 409);
        }
    }
    
    const updated = await roleModel.updateRole(roleId, role_name, role_description);
    if (!updated) {
        throw new ApiError('No changes made', 400);
    }
    
    return await roleModel.getRoleById(roleId);
};

exports.deleteRole = async (roleId) => {
    const existingRole = await roleModel.getRoleById(roleId);
    if (!existingRole) {
        throw new ApiError('Role not found', 404);
    }
    
    // Check if role is admin
    if (existingRole.role_name === 'admin') {
        throw new ApiError('Cannot delete admin role', 400);
    }
    
    const deleted = await roleModel.deleteRole(roleId);
    if (!deleted) {
        throw new ApiError('Role not found', 404);
    }
    
    return true;
};

// Role Permissions Management
exports.getRolePermissions = async (roleId) => {
    await this.getRoleById(roleId); // Check if role exists
    return await roleModel.getRolePermissions(roleId);
};

exports.assignPermissionToRole = async (roleId, permissionId, adminId) => {
    await this.getRoleById(roleId); // Check if role exists
    
    const permission = await permissionModel.getPermissionById(permissionId);
    if (!permission) {
        throw new ApiError('Permission not found', 404);
    }
    
    const result = await roleModel.assignPermissionToRole(roleId, permissionId);
    return result;
};

exports.removePermissionFromRole = async (roleId, permissionId, adminId) => {
    await this.getRoleById(roleId); // Check if role exists
    
    const permission = await permissionModel.getPermissionById(permissionId);
    if (!permission) {
        throw new ApiError('Permission not found', 404);
    }
    
    const result = await roleModel.removePermissionFromRole(roleId, permissionId);
    return result;
};

exports.bulkSetRolePermissions = async (roleId, permissionIds) => {
    await this.getRoleById(roleId);
    const result = await roleModel.bulkSetRolePermissions(roleId, permissionIds);
    return result;
};

exports.getOldRoleById = async (roleId) => {
    return await roleModel.getOldRoleById(roleId);
};

// User Role Management
exports.getUserRoles = async (userId) => {
    const user = await userModel.getUserById(userId);
    if (!user) {
        throw new ApiError('User not found', 404);
    }
    
    return await userModel.getUserRoles(userId);
};

exports.assignRoleToUser = async (userId, roleId, adminId) => {
    const user = await userModel.getUserById(userId);
    if (!user) {
        throw new ApiError('User not found', 404);
    }
    
    const role = await roleModel.getRoleById(roleId);
    if (!role) {
        throw new ApiError('Role not found', 404);
    }
    
    const result = await userModel.assignRoleToUser(userId, roleId);
    return result;
};

exports.removeRoleFromUser = async (userId, roleId, adminId) => {
    const user = await userModel.getUserById(userId);
    if (!user) {
        throw new ApiError('User not found', 404);
    }
    
    const role = await roleModel.getRoleById(roleId);
    if (!role) {
        throw new ApiError('Role not found', 404);
    }
    
    const result = await userModel.removeRoleFromUser(userId, roleId);
    return result;
};

// User Scope Management
exports.updateUserScope = async (userId, hotelIds, departmentIds, adminId) => {
    const user = await userModel.getUserById(userId);
    if (!user) {
        throw new ApiError('User not found', 404);
    }
    
    const result = await userModel.updateUserScope(userId, hotelIds, departmentIds);
    return result;
};

exports.getOldRoleById = async (roleId) => await roleModel.getOldRoleById(roleId);

// Legacy functions for backward compatibility
exports.createLegacyRole = async (roleName, description) => {
    if (!roleName) throw new ApiError('Role name is required', 400);
    const roleId = await roleModel.addNewRole(roleName, description);
    return { roleId, roleName };
}

exports.updateLegacyRole = async (roleId, roleName, description) => {
    if (!roleId) throw new ApiError('Role ID is required', 400);
    if (!roleName) throw new ApiError('Role name is required', 400);
    const existingRole = await roleModel.getRoleById(roleId);
    if (!existingRole) throw new ApiError('Role not found', 404);
    const roleWithSameName = await roleModel.getRoleByName(roleName);
    if (roleWithSameName && Number(roleWithSameName.role_id) !== Number(roleId)) throw new ApiError('Role name already exists', 400);
    await roleModel.updateRole(roleId, roleName, description);
    return { roleId, roleName };
}

exports.deleteLegacyRole = async (roleId) => {
    if (!roleId) throw new ApiError('Role ID is required', 400);
    const existingRole = await roleModel.getRoleById(roleId);
    if (!existingRole) throw new ApiError('Role not found', 404);
    await roleModel.deleteRole(roleId);
    return { roleId };
}

exports.getAllRoles = async () => {
    const roles = await roleModel.getAllRoles();
    return roles;
}