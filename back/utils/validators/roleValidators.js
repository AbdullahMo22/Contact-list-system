const { check, param, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');

exports.createRoleValidator = [
    check('role_name').notEmpty().withMessage('Role name is required').isString().withMessage('Role name must be a string'),
    check('description').optional().isString().withMessage('Role description must be a string'),
    validatorMiddleware
];

exports.updateRoleValidator = [
    param('id').notEmpty().withMessage('Role ID is required').isInt().withMessage('Role ID must be an integer'),
    body('role_name').optional().notEmpty().withMessage('Role name cannot be empty').isString().withMessage('Role name must be a string'),
    body('description').optional().isString().withMessage('Role description must be a string'),
    validatorMiddleware
];

exports.getRoleByIdValidator = [
    param('id').notEmpty().withMessage('Role ID is required').isInt().withMessage('Role ID must be an integer'),
    validatorMiddleware
];

exports.deleteRoleValidator = [
    param('id').notEmpty().withMessage('Role ID is required').isInt().withMessage('Role ID must be an integer'),
    validatorMiddleware
];

exports.assignPermissionToRoleValidator = [
    param('roleId').notEmpty().withMessage('Role ID is required').isInt().withMessage('Role ID must be an integer'),
    body('permissionId').notEmpty().withMessage('Permission ID is required').isInt().withMessage('Permission ID must be an integer'),
    validatorMiddleware
];

exports.removePermissionFromRoleValidator = [
    param('roleId').notEmpty().withMessage('Role ID is required').isInt().withMessage('Role ID must be an integer'),
    param('permissionId').notEmpty().withMessage('Permission ID is required').isInt().withMessage('Permission ID must be an integer'),
    validatorMiddleware
];

exports.getUserRolesValidator = [
    param('userId').notEmpty().withMessage('User ID is required').isInt().withMessage('User ID must be an integer'),
    validatorMiddleware
];

exports.assignRoleToUserValidator = [
    param('userId').notEmpty().withMessage('User ID is required').isInt().withMessage('User ID must be an integer'),
    body('roleId').notEmpty().withMessage('Role ID is required').isInt().withMessage('Role ID must be an integer'),
    validatorMiddleware
];

exports.removeRoleFromUserValidator = [
    param('userId').notEmpty().withMessage('User ID is required').isInt().withMessage('User ID must be an integer'),
    param('roleId').notEmpty().withMessage('Role ID is required').isInt().withMessage('Role ID must be an integer'),
    validatorMiddleware
];

exports.updateUserScopeValidator = [
    param('userId').notEmpty().withMessage('User ID is required').isInt().withMessage('User ID must be an integer'),
    body('hotelIds').optional().isArray().withMessage('Hotel IDs must be an array'),
    body('hotelIds.*').optional().isInt().withMessage('Each hotel ID must be an integer'),
    body('departmentIds').optional().isArray().withMessage('Department IDs must be an array'),
    body('departmentIds.*').optional().isInt().withMessage('Each department ID must be an integer'),
    validatorMiddleware
];

// Legacy validators for backward compatibility
exports.createLegacyRoleValidator = [
    check('roleName').notEmpty().withMessage('Role name is required'),
    check('description').optional().isString().withMessage('Description must be a string'),
    validatorMiddleware
];

exports.deleteLegacyRoleValidator = [
    check('roleId').notEmpty().withMessage('Role ID is required').isInt().withMessage('Role ID must be an integer'),
    validatorMiddleware
];

exports.updateLegacyRoleValidator = [
    check('roleId').notEmpty().withMessage('Role ID is required').isInt().withMessage('Role ID must be an integer'),    
    check('roleName').notEmpty().withMessage('Role name is required'),
    check('description').optional().isString().withMessage('Description must be a string'),
    validatorMiddleware
];

exports.getRoleByIdLegacyValidator = [
    check('roleId').notEmpty().withMessage('Role ID is required').isInt().withMessage('Role ID must be an integer'),
    validatorMiddleware
];