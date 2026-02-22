const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const hotelService = require('../services/hotelsService');
const { createHotelValidator, 
    getHotelByIdValidator, 
    updateHotelValidator, 
    deleteHotelValidator } = require('../utils/validators/hotelValidators');
const { auditLogger } = require('../middleware/auditMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { attachScope } = require('../middleware/attachScope');
const { requirePerm } = require('../middleware/requirePerm');

// ─── hotel_departments ────────────────────────────────────────────────────────
router.get('/all-links',
    protect,
    requirePerm('HOTEL_VIEW', 'CONTACT_VIEW', 'CONTACT_CREATE'),
    attachScope,
    hotelController.getAllHotelDeptLinks
);

 router.post('/:id/departments',
    protect,
    requirePerm('HOTEL_EDIT'),
    attachScope,
    hotelController.syncHotelDepts
);

 router.delete('/:id/departments/:deptId',
    protect,
    requirePerm('HOTEL_EDIT'),
    attachScope,
    hotelController.unlinkHotelDept
);

 
router.patch('/:id/toggle-active',
    protect,
    requirePerm('HOTEL_EDIT'),
    attachScope,
     auditLogger({
        action_name: 'HOTEL_EDIT',
        entity_type: 'HOTEL',
        getEntityId: (req) => req.params.id,
        getOldValues: async (req) => await hotelService.getOldHotelById(Number(req.params.id), req.scope)
    }),
    hotelController.toggleHotelActive
);

router.post('/', 
    protect,
    requirePerm('HOTEL_CREATE'),
    attachScope,
    createHotelValidator,
    auditLogger({
        action_name: 'HOTEL_CREATE',
        entity_type: 'HOTEL',
        getEntityId: (req, res) => res.locals.newHotelId,
    }),
    hotelController.createHotel
);

router.get('/', 
    protect,
    requirePerm('HOTEL_VIEW', 'CONTACT_VIEW', 'CONTACT_CREATE', 'CONTACT_EDIT'),
    attachScope,
    hotelController.getHotels
);

router.get('/:id', 
    protect, 
    requirePerm('HOTEL_VIEW', 'CONTACT_VIEW', 'CONTACT_CREATE', 'CONTACT_EDIT'), 
    attachScope, 
    getHotelByIdValidator, 
    hotelController.getHotelById
);

router.put('/:id', 
    protect, 
    requirePerm('HOTEL_EDIT'), 
    attachScope, 
    updateHotelValidator, 
    auditLogger({
        action_name: 'HOTEL_EDIT',
        entity_type: 'HOTEL',
        getEntityId: (req) => req.params.id,
        getOldValues: async (req) => await hotelService.getOldHotelById(Number(req.params.id), req.scope)
    }),
    hotelController.updateHotel
);

router.delete('/:id', 
    protect, 
    requirePerm('HOTEL_DELETE'), 
    attachScope, 
    deleteHotelValidator,
    auditLogger({
        action_name: 'HOTEL_DELETE',
        entity_type: 'HOTEL',
        getEntityId: (req) => req.params.id,
        getOldValues: async (req) => await hotelService.getOldHotelById(Number(req.params.id), req.scope)
    }),
    hotelController.deleteHotel
);

module.exports = router;