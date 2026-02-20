const pool = require('../config/db.js');
const { buildScopeWhere } = require('../utils/scopeSql');

exports.createHotel = async (hotel_name, location, userAdd) => {
    const sql = `INSERT INTO hotels (hotel_name, location, userAdd) VALUES (?, ?, ?)`;
    const values = [hotel_name, location, userAdd];
    const [rows] = await pool.query(sql, values);
    return rows.insertId;
}

exports.getHotels = async (scope) => {
    const scopeWhere = buildScopeWhere(scope, {
        hotelField: "hotel_id",
        deptField: "hotel_id"  // Hotels don't have dept, so use hotel_id for both
    });
    
    const sql = `SELECT * FROM hotels WHERE is_deleted = 0 ${scopeWhere.sql} ORDER BY hotel_id DESC`;
    console.log("Executing SQL:", sql, "with params:", scopeWhere.params);
    const [rows] = await pool.query(sql, scopeWhere.params);
    console.log("Hotels model:", rows);
    return rows;
}

exports.getHotelById = async (id, scope) => {
    const scopeWhere = buildScopeWhere(scope, {
        hotelField: "hotel_id",
        deptField: "hotel_id"
    });
    
    const sql = `SELECT * FROM hotels WHERE hotel_id = ? AND is_deleted = 0 ${scopeWhere.sql}`;
    const [rows] = await pool.query(sql, [id, ...scopeWhere.params]);
    return rows[0];
}

exports.updateHotel = async (id, hotel_name, location, userUpdate, scope) => {
    const scopeWhere = buildScopeWhere(scope, {
        hotelField: "hotel_id",
        deptField: "hotel_id"
    });
    
    const fields = [];
    const values = [];
    
    if (hotel_name !== undefined) {
        fields.push('hotel_name = ?');
        values.push(hotel_name);
    }
    if (location !== undefined) {
        fields.push('location = ?');
        values.push(location);
    }
    if (userUpdate !== undefined) {
        fields.push('userUpdate = ?, updated_at = NOW()');
        values.push(userUpdate);
    }
    
    if (fields.length === 0) return false;
    
    const sql = `UPDATE hotels SET ${fields.join(', ')} WHERE hotel_id = ? AND is_deleted = 0 ${scopeWhere.sql}`;
    values.push(id, ...scopeWhere.params);
    
    const [rows] = await pool.query(sql, values);
    return rows.affectedRows > 0;
}

exports.deleteHotel = async (id, userDelete, scope) => {
    const scopeWhere = buildScopeWhere(scope, {
        hotelField: "hotel_id",
        deptField: "hotel_id"
    });
    
    const sql = `UPDATE hotels SET is_deleted = 1, userDelete = ?, deleted_at = NOW() WHERE hotel_id = ? AND is_deleted = 0 ${scopeWhere.sql}`;
    const values = [userDelete, id, ...scopeWhere.params];
    
    const [rows] = await pool.query(sql, values);
    return rows.affectedRows > 0;
}

exports.toggleHotelActive = async (id, userUpdate) => {
    const sql = `UPDATE hotels SET is_active = NOT is_active, userUpdate = ?, updated_at = NOW() WHERE hotel_id = ? AND is_deleted = 0`;
    const [rows] = await pool.query(sql, [userUpdate, id]);
    return rows.affectedRows > 0;
}

exports.existsHotel = async (hotel_name, location, excludeId) => {
    const sql = `
    SELECT hotel_id FROM hotels 
    WHERE hotel_name = ? AND location = ? AND is_deleted = 0
    AND hotel_id != ?
    `;
    const [rows] = await pool.query(sql, [hotel_name, location, excludeId]);
    return rows.length > 0;
};

exports.getOldHotelById = async (id, scope) => {
    const scopeWhere = buildScopeWhere(scope, {
        hotelField: "hotel_id",
        deptField: "hotel_id"
    });
    
    const sql = `SELECT * FROM hotels WHERE hotel_id = ? ${scopeWhere.sql}`;
    const [rows] = await pool.query(sql, [id, ...scopeWhere.params]);
    return rows[0];
}