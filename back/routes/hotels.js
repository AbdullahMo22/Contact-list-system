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
    requirePerm('HOTEL_VIEW'),
    attachScope,
    hotelController.getHotels
);

router.get('/:id', 
    protect, 
    requirePerm('HOTEL_VIEW'), 
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