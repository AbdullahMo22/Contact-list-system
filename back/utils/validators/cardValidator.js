const { check, param, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');

exports.createCardValidator = [
  check('contact_id')
    .notEmpty().withMessage('contact_id is required')
    .isInt().withMessage('contact_id must be an integer'),

  check('card_number')
    .notEmpty().withMessage('card_number is required')
    .trim(),

  check('card_type')
    .optional()
    .notEmpty().withMessage('card_type cannot be empty'),

  check('status')
    .optional()
    .notEmpty().withMessage('status is required')
    .isIn(['ACTIVE', 'DISABLED']).withMessage('Invalid status'),

  check('issued_at')
    .notEmpty().withMessage('issued_at is required')
    .isISO8601().withMessage('Invalid issued_at date')
    .toDate(),

  check('expires_at')
    .notEmpty().withMessage('expires_at is required')
    .isISO8601().withMessage('Invalid expires_at date')
    .custom((value, { req }) => {
      const issued = req.body.issued_at ? new Date(req.body.issued_at) : null;
      const expires = new Date(value);
      if (issued && expires <= issued) throw new Error('expires_at must be after issued_at');
      return true;
    })
    .toDate(),

  validatorMiddleware
];

exports.updateCardValidator = [
  param('id')
    .notEmpty().withMessage('Card ID is required')
    .isInt().withMessage('Card ID must be an integer'),

  check('contact_id')
    .optional()
    .isInt().withMessage('contact_id must be an integer'),
  check('card_number')
    .optional()
    .trim()
    .notEmpty().withMessage('card_number cannot be empty'),

  check('card_type')
    .optional()
    .notEmpty().withMessage('card_type cannot be empty'),

  check('status')
    .optional()
    .notEmpty().withMessage('status is required')
    .isIn(['ACTIVE', 'DISABLED']).withMessage('Invalid status'),

  check('issued_at')
    .optional()
    .isISO8601().withMessage('Invalid issued_at date')
    .toDate(),

  check('expires_at')
    .optional()
    .isISO8601().withMessage('Invalid expires_at date')
    .custom((value, { req }) => {
      const issued = req.body.issued_at ? new Date(req.body.issued_at) : null;
      const expires = new Date(value);
      if (issued && expires <= issued) throw new Error('expires_at must be after issued_at');
      return true;
    })
    .toDate(),

  validatorMiddleware
];

exports.getCardByIdValidator = [
    param('id').notEmpty().withMessage('Card ID is required')
        .isInt().withMessage('Card ID must be an integer'),
    validatorMiddleware
];
exports.deleteCardValidator = [
    param('id').notEmpty().withMessage('Card ID is required')
        .isInt().withMessage('Card ID must be an integer'),
    validatorMiddleware
];
exports.getCardsByContactIdValidator = [
    param('contact_id').notEmpty().withMessage('Contact ID is required')
        .isInt().withMessage('Contact ID must be an integer'),
    validatorMiddleware
];
