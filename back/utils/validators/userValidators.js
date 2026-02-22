const {check, body, param} = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');

exports.createUserValidator = [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullName').notEmpty().withMessage('Full name is required')
    ,validatorMiddleware
];

exports.updateUserValidator = [
    param('userId').isInt().withMessage('User ID must be an integer'),
    body('username').optional().notEmpty().withMessage('Username cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
    validatorMiddleware
];

exports.deleteUserValidator = [
    param('userId').isInt().withMessage('User ID must be an integer'),
    validatorMiddleware
];

exports.getUserByIdValidator = [
    param('userId').isInt().withMessage('User ID must be an integer'),
    validatorMiddleware
];

exports.getUserByUsernameValidator = [
    param('username').notEmpty().withMessage('Username is required'),
    validatorMiddleware
];