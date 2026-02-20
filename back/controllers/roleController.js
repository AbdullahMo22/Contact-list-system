const roleService = require('../services/roleService');
const permissionModel = require('../models/permissionModels');
const asynchandler = require('express-async-handler');

// Role CRUD
exports.getRoles = asynchandler(async (req, res) => {
    const roles = await roleService.getRoles();
    res.status(200).json({ 
        data: roles,
        message: 'Roles retrieved successfully'
    });
});

exports.getRoleById = asynchandler(async (req, res) => {
    const { id } = req.params;
    const role = await roleService.getRoleById(id);
    res.status(200).json({ 
        data: role,
        message: 'Role retrieved successfully'
    });
});

exports.createRole = asynchandler(async (req, res) => {
    const { role_name, role_description } = req.body;
    const userAdd = req.user.id;
    
    const createdRole = await roleService.createRole(role_name, role_description, userAdd);
    res.locals.newRoleId = createdRole.role_id;
    req.audit = { newValues: createdRole };
    
    res.status(201).json({ 
        data: createdRole,
        message: 'Role created successfully'
    });
});

exports.updateRole = asynchandler(async (req, res) => {
    const { id } = req.params;
    const { role_name, role_description } = req.body;
    const userUpdate = req.user.id;
    
    const updatedRole = await roleService.updateRole(id, role_name, role_description, userUpdate);
    req.audit = { newValues: updatedRole };
    
    res.status(200).json({ 
        data: updatedRole,
        message: 'Role updated successfully'
    });
});

exports.deleteRole = asynchandler(async (req, res) => {
    const { id } = req.params;
    const userDelete = req.user.id;
    
    const deleted = await roleService.deleteRole(id, userDelete);
    
    res.status(200).json({ 
        data: { id },
        message: 'Role deleted successfully'
    });
});

// Role Permissions
exports.getRolePermissions = asynchandler(async (req, res) => {
    const { roleId } = req.params;
    const permissions = await roleService.getRolePermissions(roleId);
    res.status(200).json({ 
        data: permissions,
        message: 'Role permissions retrieved successfully'
    });
});

exports.assignPermissionToRole = asynchandler(async (req, res) => {
    const { roleId } = req.params;
    const { permissionId } = req.body;
    const adminId = req.user.id;
    
    const result = await roleService.assignPermissionToRole(roleId, permissionId, adminId);
    req.audit = { newValues: { roleId, permissionId, assigned: true } };
    
    res.status(200).json({ 
        data: result,
        message: 'Permission assigned to role successfully'
    });
});

exports.removePermissionFromRole = asynchandler(async (req, res) => {
    const { roleId, permissionId } = req.params;
    const adminId = req.user.id;
    
    const result = await roleService.removePermissionFromRole(roleId, permissionId, adminId);
    req.audit = { newValues: { roleId, permissionId, assigned: false } };
    
    res.status(200).json({ 
        data: result,
        message: 'Permission removed from role successfully'
    });
});

exports.bulkSetRolePermissions = asynchandler(async (req, res) => {
    const { roleId } = req.params;
    const { permissionIds } = req.body;
    if (!Array.isArray(permissionIds)) {
        return res.status(400).json({ message: 'permissionIds must be an array' });
    }
    const adminId = req.user.id;
    await roleService.bulkSetRolePermissions(roleId, permissionIds);
    req.audit = { newValues: { roleId, permissionIds } };
    res.status(200).json({
        data: { roleId, permissionIds },
        message: 'Role permissions updated successfully'
    });
});

// User Roles
exports.getUserRoles = asynchandler(async (req, res) => {
    const { userId } = req.params;
    const roles = await roleService.getUserRoles(userId);
    res.status(200).json({ 
        data: roles,
        message: 'User roles retrieved successfully'
    });
});

exports.assignRoleToUser = asynchandler(async (req, res) => {
    const { userId } = req.params;
    const { roleId } = req.body;
    const adminId = req.user.id;
    
    const result = await roleService.assignRoleToUser(userId, roleId, adminId);
    req.audit = { newValues: { userId, roleId, assigned: true } };
    
    res.status(200).json({ 
        data: result,
        message: 'Role assigned to user successfully'
    });
});

exports.removeRoleFromUser = asynchandler(async (req, res) => {
    const { userId, roleId } = req.params;
    const adminId = req.user.id;
    
    const result = await roleService.removeRoleFromUser(userId, roleId, adminId);
    req.audit = { newValues: { userId, roleId, assigned: false } };
    
    res.status(200).json({ 
        data: result,
        message: 'Role removed from user successfully'
    });
});

// User Scope
exports.updateUserScope = asynchandler(async (req, res) => {
    const { userId } = req.params;
    const { hotelIds, departmentIds } = req.body;
    const adminId = req.user.id;
    
    const result = await roleService.updateUserScope(userId, hotelIds, departmentIds, adminId);
    req.audit = { newValues: { userId, hotelIds, departmentIds } };
    
    res.status(200).json({ 
        data: result,
        message: 'User scope updated successfully'
    });
});

// Get all permissions (for admin UI)
exports.getPermissions = asynchandler(async (req, res) => {
    const permissions = await permissionModel.getPermissions();
    res.status(200).json({ 
        data: permissions,
        message: 'Permissions retrieved successfully'
    });
});

// Legacy functions for backward compatibility
exports.createLegacyRole = asynchandler(async (req, res) => {
    const { roleName, description } = req.body;
    const role = await roleService.createLegacyRole(roleName, description);
    res.status(201).json({ message: 'Role created successfully', role });
});

exports.updateLegacyRole = asynchandler(async (req, res) => {
    const { roleId } = req.params;
    const { roleName, description } = req.body;
    const role = await roleService.updateLegacyRole(roleId, roleName, description);
    res.status(200).json({ message: 'Role updated successfully', role });
});

exports.deleteLegacyRole = asynchandler(async (req, res) => {
    const { roleId } = req.params;
    await roleService.deleteLegacyRole(roleId);
    res.status(200).json({ message: 'Role deleted successfully', roleId });
});

exports.getAllRoles = asynchandler(async (req, res) => {
    const roles = await roleService.getAllRoles();
    res.status(200).json({ roles });
}); 