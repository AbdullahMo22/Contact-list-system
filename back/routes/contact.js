const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const contactService = require('../services/contactService');
const {createContactValidator, updateContactValidator, getContactByIdValidator, deleteContactValidator} = require('../utils/validators/contactValidator');
const { auditLogger } = require('../middleware/auditMiddleware');
const {protect} = require('../middleware/authMiddleware');
const {attachScope}=require('../middleware/attachScope');
const {requirePerm}=require('../middleware/requirePerm');

router.post('/', 
    protect,
    requirePerm('CONTACT_CREATE')
    ,attachScope
    ,createContactValidator,
    auditLogger({
        action_name:'CONTACT_CREATE',
        entity_type:'CONTACT',
        getEntityId:(req,res)=>res.locals.newContactId,
    }),
     contactController.createContact);
router.get('/', 
    protect,
    requirePerm('CONTACT_VIEW')
    ,attachScope
    ,contactController.getContacts);

router.get('/:id', protect, 
    requirePerm('CONTACT_VIEW'), attachScope, 
    getContactByIdValidator, contactController.getContactById);

router.put('/:id', protect, 
    requirePerm('CONTACT_EDIT'), attachScope, updateContactValidator, 
    auditLogger({
        action_name:'CONTACT_EDIT',
        entity_type:'CONTACT',
        getEntityId:(req)=>req.params.id,
        getOldValues: async (req) => await contactService.getOldContactById(Number(req.params.id),req.scope)
    })
    ,contactController.updateContact);
router.delete('/:id', protect, 
    requirePerm('CONTACT_DELETE'), attachScope, deleteContactValidator,
    auditLogger({
        action_name:'CONTACT_DELETE',
        entity_type:'CONTACT',
        getEntityId:(req)=>req.params.id,
        getOldValues: async (req) => await contactService.getOldContactById(Number(req.params.id),req.scope)
    })
    ,contactController.deleteContact);

module.exports = router;