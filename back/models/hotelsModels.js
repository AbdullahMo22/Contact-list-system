const pool = require('../config/db.js');
const { buildHotelScopeWhere } = require('../utils/scopeSql');

exports.createHotel = async (hotel_name, location, userAdd) => {
    const sql = `INSERT INTO hotels (hotel_name, location, userAdd) VALUES (?, ?, ?)`;
    const values = [hotel_name, location, userAdd];
    const [rows] = await pool.query(sql, values);
    return rows.insertId;
}

exports.getHotels = async (scope) => {
    const scopeWhere = buildHotelScopeWhere(scope);
    const sql = `SELECT * FROM hotels WHERE is_deleted = 0 ${scopeWhere.sql} ORDER BY hotel_id DESC`;
    const [rows] = await pool.query(sql, scopeWhere.params);
    return rows;
}

exports.getHotelById = async (id, scope) => {
    const scopeWhere = buildHotelScopeWhere(scope);
    const sql = `SELECT * FROM hotels WHERE hotel_id = ? AND is_deleted = 0 ${scopeWhere.sql}`;
    const [rows] = await pool.query(sql, [id, ...scopeWhere.params]);
    return rows[0];
}

exports.updateHotel = async (id, hotel_name, location, userUpdate, scope) => {
    const scopeWhere = buildHotelScopeWhere(scope);
    
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
    const scopeWhere = buildHotelScopeWhere(scope);
    
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
    const scopeWhere = buildHotelScopeWhere(scope);
    const sql = `SELECT * FROM hotels WHERE hotel_id = ? ${scopeWhere.sql}`;
    const [rows] = await pool.query(sql, [id, ...scopeWhere.params]);
    return rows[0];
}

exports.getAllHotelDeptLinks = async (hotelIds, departmentIds, userId) => {
    if (userId) {
        const sql = `SELECT hotel_id, department_id FROM user_hotel_departments WHERE user_id = ?`;
        const [rows] = await pool.query(sql, [userId]);
        return rows;
    }

    // Admin: query hotel_departments (no scope restriction)
    const conditions = [];
    const params = [];

    if (hotelIds !== null && hotelIds !== undefined) {
        if (hotelIds.length === 0) return [];
        conditions.push(`hotel_id IN (${hotelIds.map(() => '?').join(',')})`);
        params.push(...hotelIds);
    }
    if (departmentIds !== null && departmentIds !== undefined && departmentIds.length > 0) {
        conditions.push(`department_id IN (${departmentIds.map(() => '?').join(',')})`);
        params.push(...departmentIds);
    }

    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT hotel_id, department_id FROM hotel_departments${where}`;
    // console.log('[getAllHotelDeptLinks] SQL:', sql, '| params:', params);
    const [rows] = await pool.query(sql, params);
    // console.log('[getAllHotelDeptLinks] returned', rows.length, 'links from hotel_departments (admin)');
    return rows;
};

 exports.getDepartmentsForHotel = async (hotelId) => {
    const sql = `
        SELECT d.*
        FROM departments d
        INNER JOIN hotel_departments hd ON hd.department_id = d.department_id
        WHERE hd.hotel_id = ? AND d.is_deleted = 0
        ORDER BY d.department_id ASC
    `;
    const [rows] = await pool.query(sql, [hotelId]);
    return rows;
};

 
exports.syncHotelDepartments = async (hotelId, departmentIds) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(`DELETE FROM hotel_departments WHERE hotel_id = ?`, [hotelId]);
        if (departmentIds.length > 0) {
            const placeholders = departmentIds.map(() => '(?,?)').join(',');
            const values = departmentIds.flatMap((dId) => [hotelId, dId]);
            await conn.query(
                `INSERT IGNORE INTO hotel_departments (hotel_id, department_id) VALUES ${placeholders}`,
                values
            );
        }
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

 exports.unlinkDepartmentFromHotel = async (hotelId, departmentId) => {
    const [rows] = await pool.query(
        `DELETE FROM hotel_departments WHERE hotel_id = ? AND department_id = ?`,
        [hotelId, departmentId]
    );
    return rows.affectedRows > 0;
};