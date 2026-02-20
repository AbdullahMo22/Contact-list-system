const {check,body,param} = require("express-validator");
const validatorMiddleware = require("../../middleware/validatorMiddleware");
exports.createContactValidator=[
    check('full_name').notEmpty().withMessage('Full name is required'),
    check('email').isEmail().withMessage('Valid email is required'),
    check('phone').notEmpty().withMessage('Phone number is required'),
    check('hotel_id').notEmpty().withMessage('Hotel ID is required').isInt().withMessage('Hotel ID must be an integer'),
    check('department_id').notEmpty().withMessage('Department ID is required').isInt().withMessage('Department ID must be an integer'),
    check('job_title').notEmpty().withMessage('Job title is required'),
    check("notes").optional().isString().withMessage("Notes must be a string"),
    validatorMiddleware
];
exports.updateContactValidator=[    
    param('id').notEmpty().withMessage('Contact ID is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
    body('phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
    body('hotel_id').optional().notEmpty().withMessage('Hotel ID cannot be empty').isInt().withMessage('Hotel ID must be an integer'),
    body('department_id').optional().notEmpty().withMessage('Department ID cannot be empty').isInt().withMessage('Department ID must be an integer'),
    body('job_title').optional().notEmpty().withMessage('Job title cannot be empty'),
        body("notes").optional().isString().withMessage("Notes must be a string"),
    validatorMiddleware

];
exports.getContactByIdValidator=[
    param('id').notEmpty().withMessage('Contact ID is required'),
    validatorMiddleware
];
exports.deleteContactValidator=[
    param('id').notEmpty().withMessage('Contact ID is required'),
    validatorMiddleware
];
