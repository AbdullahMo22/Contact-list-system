const permissionModel = require("../models/permissionModels");
const ApiError = require("../utils/apiError");

exports.getAllPermissions = async () => {
    return await permissionModel.getPermissions();
};

exports.getPermissionById = async (permId) => {
    const perm = await permissionModel.getPermissionById(permId);
    if (!perm) throw new ApiError('Permission not found', 404);
    return perm;
};

exports.createPermission = async (permKey, module_name, action_name) => {
    if (!permKey || !module_name || !action_name)
        throw new ApiError('perm_key, module_name and action_name are required', 400);
    const id = await permissionModel.createPermission(permKey.toUpperCase().trim(), module_name.trim(), action_name.trim());
    return await permissionModel.getPermissionById(id);
};

exports.updatePermission = async (permId, permKey, module_name, action_name) => {
    await this.getPermissionById(permId);
    await permissionModel.updatePermission(
        permId,
        permKey ? permKey.toUpperCase().trim() : undefined,
        module_name ? module_name.trim() : undefined,
        action_name ? action_name.trim() : undefined
    );
    return await permissionModel.getPermissionById(permId);
};

exports.deletePermission = async (permId) => {
    await this.getPermissionById(permId);
    await permissionModel.deletePermission(permId);
    return true;
};

exports.assignPermissionToRole = async (roleId, permId) => {
    return await permissionModel.assignPermissionToRole(roleId, permId);
};

exports.removePermissionFromRole = async (roleId, permId) => {
    return await permissionModel.removePermissionFromRole(roleId, permId);
};