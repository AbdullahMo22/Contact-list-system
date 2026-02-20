const pool = require('../config/db.js');
const { buildScopeWhere } = require('../utils/scopeSql');

exports.createDepartment = async (hotel_id, department_name, userAdd) => {
    const sql = `INSERT INTO departments (hotel_id,department_name,userAdd) VALUES (?,?,?)`;
    const values = [hotel_id, department_name, userAdd];
    const [rows] = await pool.query(sql, values);
    return rows.insertId;
}

exports.getDepartments = async (scope) => {
    const scopeWhere = buildScopeWhere(scope, {
        hotelField: "hotel_id",
        deptField: "department_id"
    });
    
    const sql = `SELECT * FROM departments WHERE is_deleted = 0 ${scopeWhere.sql} ORDER BY department_id DESC`;
    const [rows] = await pool.query(sql, scopeWhere.params);
    return rows;
}

exports.getDepartmentById = async (id, scope) => {
    const scopeWhere = buildScopeWhere(scope, {
        hotelField: "hotel_id", 
        deptField: "department_id"
    });
    
    const sql = `SELECT * FROM departments WHERE department_id = ? AND is_deleted = 0 ${scopeWhere.sql}`;
    const [rows] = await pool.query(sql, [id, ...scopeWhere.params]);
    return rows[0];
}

exports.updateDepartment = async (id, hotel_id, department_name, userUpdate, scope) => {
    const scopeWhere = buildScopeWhere(scope, {
        hotelField: "hotel_id",
        deptField: "department_id"
    });
    
    const fields = [];
    const values = [];
    
    if (hotel_id !== undefined) {
        fields.push('hotel_id = ?');
        values.push(hotel_id);
    }
    if (department_name !== undefined) {
        fields.push('department_name = ?');
        values.push(department_name);
    }
    if (userUpdate !== undefined) {
        fields.push('userUpdate = ?, updated_at = NOW()');
        values.push(userUpdate);
    }
    
    if (fields.length === 0) return false;
    
    const sql = `UPDATE departments SET ${fields.join(', ')} WHERE department_id = ? AND is_deleted = 0 ${scopeWhere.sql}`;
    values.push(id, ...scopeWhere.params);
    
    const [rows] = await pool.query(sql, values);
    return rows.affectedRows > 0;
}

exports.deleteDepartment = async (id, userDelete, scope) => {
    const scopeWhere = buildScopeWhere(scope, {
        hotelField: "hotel_id",
        deptField: "department_id"
    });
    
    const sql = `UPDATE departments SET is_deleted = 1, userDelete = ?, deleted_at = NOW() WHERE department_id = ? AND is_deleted = 0 ${scopeWhere.sql}`;
    const values = [userDelete, id, ...scopeWhere.params];
    
    const [rows] = await pool.query(sql, values);
    return rows.affectedRows > 0;
}

exports.toggleDeptActive = async (id, userUpdate) => {
    const sql = `UPDATE departments SET is_active = NOT is_active, userUpdate = ?, updated_at = NOW() WHERE department_id = ? AND is_deleted = 0`;
    const [rows] = await pool.query(sql, [userUpdate, id]);
    return rows.affectedRows > 0;
}

exports.existsDepartment = async (hotel_id, department_name, excludeId) => {
    const sql = `
    SELECT department_id FROM departments 
    WHERE hotel_id = ? AND department_name = ? AND is_deleted = 0
    AND department_id != ?
    `;
    const [rows] = await pool.query(sql, [hotel_id, department_name, excludeId]);
    return rows.length > 0;
};

exports.getOldDepartmentById = async (id, scope) => {
    const scopeWhere = buildScopeWhere(scope, {
        hotelField: "hotel_id",
        deptField: "department_id"
    });
    
    const sql = `SELECT * FROM departments WHERE department_id = ? ${scopeWhere.sql}`;
    const [rows] = await pool.query(sql, [id, ...scopeWhere.params]);
    return rows[0];
}