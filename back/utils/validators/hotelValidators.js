const { check, param, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');

exports.createHotelValidator = [
    check('hotel_name').notEmpty().withMessage('Hotel name is required').isString().withMessage('Hotel name must be a string'),
    check('location').notEmpty().withMessage('Location is required').isString().withMessage('Location must be a string'),
    validatorMiddleware
];

exports.updateHotelValidator = [
    param('id').notEmpty().withMessage('Hotel ID is required').isInt().withMessage('Hotel ID must be an integer'),
    body('hotel_name').optional().notEmpty().withMessage('Hotel name cannot be empty').isString().withMessage('Hotel name must be a string'),
    body('location').optional().notEmpty().withMessage('Location cannot be empty').isString().withMessage('Location must be a string'),
    validatorMiddleware
];

exports.getHotelByIdValidator = [
    param('id').notEmpty().withMessage('Hotel ID is required').isInt().withMessage('Hotel ID must be an integer'),
    validatorMiddleware
];

exports.deleteHotelValidator = [
    param('id').notEmpty().withMessage('Hotel ID is required').isInt().withMessage('Hotel ID must be an integer'),
    validatorMiddleware
];