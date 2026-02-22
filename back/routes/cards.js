const express = require('express');
const router = express.Router();

const cardController = require('../controllers/cardController');
const cardService = require('../services/cardService');

const {
  createCardValidator,
  updateCardValidator,
  getCardByIdValidator,
  deleteCardValidator,
  getCardsByContactIdValidator,
} = require('../utils/validators/cardValidator');

const { auditLogger } = require('../middleware/auditMiddleware');

// ✅ RBAC middlewares
const { protect } = require('../middleware/authMiddleware');
const { attachScope } = require('../middleware/attachScope');
const { requirePerm } = require('../middleware/requirePerm');

// --- CREATE
router.post('/',
  protect,
  attachScope,
  requirePerm('CARD_CREATE'),
  createCardValidator,
  auditLogger({
    action_name: 'CARD_CREATE',
    entity_type: 'CARD',
    getEntityId: (req, res) => res.locals.newCardId,
  }),
  cardController.createCard
);

// --- UPDATE
router.put('/:id',
  protect,
  attachScope,
  requirePerm('CARD_EDIT'),
  updateCardValidator,
  auditLogger({
    action_name: 'CARD_EDIT',
    entity_type: 'CARD',
    getEntityId: (req) => req.params.id,
    getOldValues: async (req) => cardService.getoldCardById(Number(req.params.id)),
  }),
  cardController.updateCard
);

// --- LIST
router.get('/',
  protect,
  attachScope,
  requirePerm('CARD_VIEW'),
  cardController.getCards
);

// --- DELETE
router.delete('/:id',
  protect,
  attachScope,
  requirePerm('CARD_DELETE'),
  deleteCardValidator,
  auditLogger({
    action_name: 'CARD_DELETE',
    entity_type: 'CARD',
    getEntityId: (req) => req.params.id,
    getOldValues: async (req) => cardService.getoldCardById(Number(req.params.id)),
  }),
  cardController.deleteCard
);

// --- BY CONTACT
router.get('/contact/:contact_id',
  protect,
  attachScope,
  requirePerm('CARD_VIEW'),
  getCardsByContactIdValidator,
  cardController.getCardsByContactId
);

// --- BY ID
router.get('/:id',
  protect,
  attachScope,
  requirePerm('CARD_VIEW'),
  getCardByIdValidator,
  cardController.getCardById
);

module.exports = router;
