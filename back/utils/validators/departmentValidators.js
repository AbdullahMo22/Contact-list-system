const { check, param, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');

exports.createDepartmentValidator = [
    check('department_name').notEmpty().withMessage('Department name is required').isString().withMessage('Department name must be a string'),
    validatorMiddleware
];

exports.updateDepartmentValidator = [
    param('id').notEmpty().withMessage('Department ID is required').isInt().withMessage('Department ID must be an integer'),
    body('department_name').optional().notEmpty().withMessage('Department name cannot be empty').isString().withMessage('Department name must be a string'),
    validatorMiddleware
];

exports.getDepartmentByIdValidator = [
    param('id').notEmpty().withMessage('Department ID is required').isInt().withMessage('Department ID must be an integer'),
    validatorMiddleware
];

exports.deleteDepartmentValidator = [
    param('id').notEmpty().withMessage('Department ID is required').isInt().withMessage('Department ID must be an integer'),
    validatorMiddleware
];