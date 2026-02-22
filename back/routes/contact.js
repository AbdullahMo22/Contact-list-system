const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const contactService = require('../services/contactService');
const {
  createContactValidator,
  updateContactValidator,
  getContactByIdValidator,
  deleteContactValidator
} = require('../utils/validators/contactValidator');
const { auditLogger } = require('../middleware/auditMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { attachScope } = require('../middleware/attachScope');
const { requirePerm } = require('../middleware/requirePerm');

// ✅ الترتيب الصحيح: protect → attachScope → requirePerm → validator → audit → controller

router.post('/',
  protect,
  attachScope,
  requirePerm('CONTACT_CREATE'),
  createContactValidator,
  auditLogger({
    action_name: 'CONTACT_CREATE',
    entity_type: 'CONTACT',
    getEntityId: (req, res) => res.locals.newContactId,
  }),
  contactController.createContact
);

router.get('/',
  protect,
  attachScope,
  requirePerm('CONTACT_VIEW'),
  contactController.getContacts
);

router.get('/:id',
  protect,
  attachScope,
  requirePerm('CONTACT_VIEW'),
  getContactByIdValidator,
  contactController.getContactById
);

router.put('/:id',
  protect,
  attachScope,
  requirePerm('CONTACT_EDIT'),
  updateContactValidator,
  auditLogger({
    action_name: 'CONTACT_EDIT',
    entity_type: 'CONTACT',
    getEntityId: (req) => req.params.id,
    getOldValues: async (req) => contactService.getOldContactById(Number(req.params.id), req.scope),
  }),
  contactController.updateContact
);

router.delete('/:id',
  protect,
  attachScope,
  requirePerm('CONTACT_DELETE'),
  deleteContactValidator,
  auditLogger({
    action_name: 'CONTACT_DELETE',
    entity_type: 'CONTACT',
    getEntityId: (req) => req.params.id,
    getOldValues: async (req) => contactService.getOldContactById(Number(req.params.id), req.scope),
  }),
  contactController.deleteContact
);

module.exports = router;