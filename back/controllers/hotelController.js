const hotelService = require('../services/hotelsService');
const asynchandler = require('express-async-handler');

exports.createHotel = asynchandler(async (req, res) => {
    const { hotel_name, location } = req.body;
    const userAdd = req.user.id;
    
    const createdHotel = await hotelService.createHotel(hotel_name, location, userAdd, req.scope);
    res.locals.newHotelId = createdHotel.hotel_id;
    req.audit = { newValues: createdHotel };
    
    res.status(201).json({ 
        data: createdHotel,
        message: 'Hotel created successfully' 
    });
});

exports.getHotels = asynchandler(async (req, res) => {
    const hotels = await hotelService.getHotels(req.scope);
    console.log("Hotels retrieved:", hotels);
    res.status(200).json({ 
        data: hotels,
        message: 'Hotels retrieved successfully'
    });
});

exports.getHotelById = asynchandler(async (req, res) => {
    const { id } = req.params;
    const hotel = await hotelService.getHotelById(id, req.scope);
    res.status(200).json({ 
        data: hotel,
        message: 'Hotel retrieved successfully'
    });
});

exports.updateHotel = asynchandler(async (req, res) => {
    const { id } = req.params;
    const { hotel_name, location } = req.body;
    const userUpdate = req.user.id;
    
    const updatedHotel = await hotelService.updateHotel(id, hotel_name, location, userUpdate, req.scope);
    req.audit = { newValues: updatedHotel };
    
    res.status(200).json({ 
        data: updatedHotel,
        message: 'Hotel updated successfully'
    });
});

exports.deleteHotel = asynchandler(async (req, res) => {
    const { id } = req.params;
    const userDelete = req.user.id;
    
    const deleted = await hotelService.deleteHotel(id, userDelete, req.scope);
    res.status(200).json({ 
        data: { id },
        message: 'Hotel deleted successfully'
    });
});

exports.toggleHotelActive = asynchandler(async (req, res) => {
    const { id } = req.params;
    const userUpdate = req.user.id;
    const updated = await hotelService.toggleHotelActive(id, userUpdate, req.scope);
        req.audit = { newValues: updated };

    res.status(200).json({
        data: updated,
        message: `Hotel ${updated.is_active ? 'activated' : 'deactivated'} successfully`
    });
});