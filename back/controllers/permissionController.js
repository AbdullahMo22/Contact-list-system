const asynchandler = require("express-async-handler");
const permissionService = require("../services/pemissionService");

exports.getAllPermissions = asynchandler(async (req, res) => {
    const permissions = await permissionService.getAllPermissions();
    res.json({ data: permissions, message: 'Permissions retrieved successfully' });
});

exports.createPermission = asynchandler(async (req, res) => {
    const { permKey, module_name, action_name } = req.body;
    const newPerm = await permissionService.createPermission(permKey, module_name, action_name);
    res.status(201).json({ data: newPerm, message: 'Permission created successfully' });
});

exports.updatePermission = asynchandler(async (req, res) => {
    const { permId } = req.params;
    const { permKey, module_name, action_name } = req.body;
    const updated = await permissionService.updatePermission(permId, permKey, module_name, action_name);
    res.json({ data: updated, message: 'Permission updated successfully' });
});

exports.deletePermission = asynchandler(async (req, res) => {
    const { permId } = req.params;
    await permissionService.deletePermission(permId);
    res.json({ data: { permId }, message: 'Permission deleted successfully' });
});

exports.assignPermissionToRole = asynchandler(async (req, res) => {
    const { roleId, permId } = req.body;
    const result = await permissionService.assignPermissionToRole(roleId, permId);
    res.json({ data: result });
});

exports.removePermissionFromRole = asynchandler(async (req, res) => {
    const { roleId, permId } = req.body;
    const result = await permissionService.removePermissionFromRole(roleId, permId);
    res.json({ data: result });
});
