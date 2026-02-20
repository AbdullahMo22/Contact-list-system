const hotelModel = require('../models/hotelsModels');
const ApiError = require('../utils/ApiError');

exports.createHotel = async (hotel_name, location, userAdd, scope) => {
    if (!hotel_name || !location || !userAdd) {
        throw new ApiError('Missing required fields', 400);
    }
    
    const hotelId = await hotelModel.createHotel(hotel_name, location, userAdd);
    const createdRow = await hotelModel.getHotelById(hotelId, scope);
    return createdRow;
}

exports.getHotels = async (scope) => {
    const hotels = await hotelModel.getHotels(scope);
    console.log("Hotels service:", hotels);
    return hotels;
}

exports.getHotelById = async (id, scope) => {
    if (!id) {
        throw new ApiError('Missing required fields', 400);
    }

    const hotel = await hotelModel.getHotelById(id, scope);
    if (!hotel) {
        throw new ApiError('Hotel not found', 404);
    }
    return hotel;
}

exports.updateHotel = async (id, hotel_name, location, userUpdate, scope) => {
    if (!id) {
        throw new ApiError('Missing required fields', 400);
    }

    const existingHotel = await hotelModel.getHotelById(id, scope);
    if (!existingHotel) {
        throw new ApiError('Hotel not found', 404);
    }

    const hotelExists = await hotelModel.existsHotel(hotel_name, location, id);
    if (hotelExists) {
        throw new ApiError('Hotel with the same name and location already exists', 409);
    }

    const isUpdated = await hotelModel.updateHotel(id, hotel_name, location, userUpdate, scope);
    if (!isUpdated) {
        throw new ApiError('Hotel not found or no fields to update', 404);
    }
    
    const updatedRow = await hotelModel.getHotelById(id, scope);
    return updatedRow;
}

exports.deleteHotel = async (id, userDelete, scope) => {
    if (!id || !userDelete) {
        throw new ApiError('Missing required fields', 400);
    }

    const existingHotel = await hotelModel.getHotelById(id, scope);
    if (!existingHotel) {
        throw new ApiError('Hotel not found', 404);
    }

    const isDeleted = await hotelModel.deleteHotel(id, userDelete, scope);
    if (!isDeleted) {
        throw new ApiError('Hotel not found', 404);
    }
    return true;
}

exports.getOldHotelById = async (id, scope) => await hotelModel.getOldHotelById(id, scope);

exports.toggleHotelActive = async (id, userUpdate, scope) => {
    const hotel = await hotelModel.getHotelById(id, scope);
    if (!hotel) throw new ApiError('Hotel not found', 404);
    await hotelModel.toggleHotelActive(id, userUpdate);
    return await hotelModel.getHotelById(id, scope);
}