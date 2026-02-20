const {check,body,param}=require('express-validator');
const validatorMiddleware=require('../../middleware/validatorMiddleware');
exports.createPermissionValidator=[
    check('permKey').notEmpty().withMessage('Permission key is required'),
    check('module_name').notEmpty().withMessage('Module name is required'),
    check('action_name').notEmpty().withMessage('Action name is required'),
    validatorMiddleware
];
exports.deletePermissionValidator=[
    param('permId').notEmpty().withMessage('Permission ID is required').isInt().withMessage('Permission ID must be an integer'),
    validatorMiddleware];
exports.updatePermissionValidator=[
    param('permId').notEmpty().withMessage('Permission ID is required').isInt().withMessage('Permission ID must be an integer'),
    check('permKey').optional().notEmpty().withMessage('Permission key cannot be empty'),
    check('module_name').optional().notEmpty().withMessage('Module name cannot be empty'),
    check('action_name').optional().notEmpty().withMessage('Action name cannot be empty'),
    validatorMiddleware
];
exports.assignPermissionToRoleValidator=[
    check('roleId').notEmpty().withMessage('Role ID is required').isInt().withMessage('Role ID must be an integer'),
    check('permId').notEmpty().withMessage('Permission ID is required').isInt().withMessage('Permission ID must be an integer'),    
    validatorMiddleware
];
exports.removePermissionFromRoleValidator=[ 
    check('roleId').notEmpty().withMessage('Role ID is required').isInt().withMessage('Role ID must be an integer'),
    check('permId').notEmpty().withMessage('Permission ID is required').isInt().withMessage('Permission ID must be an integer'),    
    validatorMiddleware
];