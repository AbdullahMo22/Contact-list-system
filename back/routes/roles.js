const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const roleService = require('../services/roleService');
const { protect } = require('../middleware/authMiddleware');
const { requirePerm } = require('../middleware/requirePerm');
const { auditLogger } = require('../middleware/auditMiddleware');
const { 
    createRoleValidator, 
    updateRoleValidator,
    getRoleByIdValidator,
    deleteRoleValidator,
    assignPermissionToRoleValidator,
    removePermissionFromRoleValidator,
    assignRoleToUserValidator,
    removeRoleFromUserValidator,
    updateUserScopeValidator,
    getUserRolesValidator
} = require('../utils/validators/roleValidators');

// Role CRUD
router.get('/', 
    protect, 
    requirePerm('ROLE_MANAGE'), 
    roleController.getRoles
);

router.get('/:id', 
    protect, 
    requirePerm('ROLE_MANAGE'), 
    getRoleByIdValidator,
    roleController.getRoleById
);

router.post('/', 
    protect, 
    requirePerm('ROLE_MANAGE'), 
    createRoleValidator,
    auditLogger({
        action_name: 'ROLE_CREATE',
        entity_type: 'ROLE',
        getEntityId: (req, res) => res.locals.newRoleId,
    }),
    roleController.createRole
);

router.put('/:id', 
    protect, 
    requirePerm('ROLE_MANAGE'), 
    updateRoleValidator,
    auditLogger({
        action_name: 'ROLE_EDIT',
        entity_type: 'ROLE',
        getEntityId: (req) => req.params.id,
        getOldValues: async (req) => await roleService.getOldRoleById(Number(req.params.id))
    }),
    roleController.updateRole
);

router.delete('/:id', 
    protect, 
    requirePerm('ROLE_MANAGE'), 
    deleteRoleValidator,
    auditLogger({
        action_name: 'ROLE_DELETE',
        entity_type: 'ROLE',
        getEntityId: (req) => req.params.id,
        getOldValues: async (req) => await roleService.getOldRoleById(Number(req.params.id))
    }),
    roleController.deleteRole
);
// Get all permissions (for admin UI)
router.get('/system/permissions', 
    protect, 
    requirePerm('ROLE_MANAGE'),
    roleController.getPermissions
);
router.put('/:roleId/permissions',
    protect,
    requirePerm('ROLE_MANAGE'),
    auditLogger({
        action_name: 'ROLE_PERMISSIONS_BULK_UPDATE',
        entity_type: 'ROLE_PERMISSION',
        getEntityId: (req) => req.params.roleId,
    }),
    roleController.bulkSetRolePermissions
);

// Role Permissions Management
router.get('/:roleId/permissions', 
    protect, 
    requirePerm('ROLE_MANAGE'),
    roleController.getRolePermissions
);

router.post('/:roleId/permissions', 
    protect, 
    requirePerm('ROLE_MANAGE'), 
    assignPermissionToRoleValidator,
    auditLogger({
        action_name: 'ROLE_PERMISSION_ASSIGN',
        entity_type: 'ROLE_PERMISSION',
        getEntityId: (req) => req.params.roleId,
    }),
    roleController.assignPermissionToRole
);

router.delete('/:roleId/permissions/:permissionId', 
    protect, 
    requirePerm('ROLE_MANAGE'),
    auditLogger({
        action_name: 'ROLE_PERMISSION_REMOVE',
        entity_type: 'ROLE_PERMISSION',
        getEntityId: (req) => req.params.roleId,
    }),
    roleController.removePermissionFromRole
);

// User Role Management
router.get('/users/:userId/roles', 
    protect, 
    requirePerm('ROLE_MANAGE'), 
    getUserRolesValidator,
    roleController.getUserRoles
);

router.post('/users/:userId/roles', 
    protect, 
    requirePerm('ROLE_MANAGE'), 
    assignRoleToUserValidator,
    auditLogger({
        action_name: 'USER_ROLE_ASSIGN',
        entity_type: 'USER_ROLE',
        getEntityId: (req) => req.params.userId,
    }),
    roleController.assignRoleToUser
);

router.delete('/users/:userId/roles/:roleId', 
    protect, 
    requirePerm('ROLE_MANAGE'),
    auditLogger({
        action_name: 'USER_ROLE_REMOVE',
        entity_type: 'USER_ROLE',
        getEntityId: (req) => req.params.userId,
    }),
    roleController.removeRoleFromUser
);

// User Scope Management
router.put('/users/:userId/scope', 
    protect, 
    requirePerm('ROLE_MANAGE'), 
    updateUserScopeValidator,
    auditLogger({
        action_name: 'USER_SCOPE_UPDATE',
        entity_type: 'USER_SCOPE',
        getEntityId: (req) => req.params.userId,
    }),
    roleController.updateUserScope
);



module.exports = router;