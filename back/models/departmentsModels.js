const pool = require('../config/db.js');

 
function buildDeptScopeWhere(scope) {
    if (!scope) return { sql: '', params: [] };

    const departmentIds = scope.departmentIds || [];

    // console.log('[buildDeptScopeWhere] scope:', JSON.stringify(scope));

    if (departmentIds.length === 0) {
        console.log('[buildDeptScopeWhere] no departmentIds in scope -> returning 1=0');
        return { sql: ' AND 1=0 ', params: [] };
    }

    // console.log('[buildDeptScopeWhere] filtering by departmentIds:', departmentIds);
    return {
        sql: ` AND department_id IN (${departmentIds.map(() => '?').join(',')}) `,
        params: [...departmentIds],
    };
}

exports.createDepartment = async (department_name, userAdd) => {
    const sql = `INSERT INTO departments (department_name, userAdd) VALUES (?,?)`;
    const [rows] = await pool.query(sql, [department_name, userAdd]);
    return rows.insertId;
}

exports.getDepartments = async (scope) => {
    const scopeWhere = buildDeptScopeWhere(scope);
    const sql = `SELECT * FROM departments WHERE is_deleted = 0 ${scopeWhere.sql} ORDER BY department_id DESC`;
    // console.log('[getDepartments] SQL:', sql, '| params:', scopeWhere.params);
    const [rows] = await pool.query(sql, scopeWhere.params);
    // console.log('[getDepartments] returned', rows.length, 'rows:', rows.map(r => `${r.department_id}:${r.department_name}`));
    return rows;
}

exports.getDepartmentById = async (id, scope) => {
    const scopeWhere = buildDeptScopeWhere(scope);
    const sql = `SELECT * FROM departments WHERE department_id = ? AND is_deleted = 0 ${scopeWhere.sql}`;
    const [rows] = await pool.query(sql, [id, ...scopeWhere.params]);
    return rows[0];
}

exports.updateDepartment = async (id, department_name, userUpdate, scope) => {
    const scopeWhere = buildDeptScopeWhere(scope);

    const fields = [];
    const values = [];

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
    const scopeWhere = buildDeptScopeWhere(scope);
    const sql = `UPDATE departments SET is_deleted = 1, userDelete = ?, deleted_at = NOW() WHERE department_id = ? AND is_deleted = 0 ${scopeWhere.sql}`;
    const [rows] = await pool.query(sql, [userDelete, id, ...scopeWhere.params]);
    return rows.affectedRows > 0;
}

exports.toggleDeptActive = async (id, userUpdate) => {
    const sql = `UPDATE departments SET is_active = NOT is_active, userUpdate = ?, updated_at = NOW() WHERE department_id = ? AND is_deleted = 0`;
    const [rows] = await pool.query(sql, [userUpdate, id]);
    return rows.affectedRows > 0;
}

 exports.existsDepartment = async (department_name, excludeId) => {
    const sql = `SELECT department_id FROM departments WHERE department_name = ? AND is_deleted = 0 AND department_id != ?`;
    const [rows] = await pool.query(sql, [department_name, excludeId ?? 0]);
    return rows.length > 0;
};

exports.getOldDepartmentById = async (id, scope) => {
    const scopeWhere = buildDeptScopeWhere(scope);
    const sql = `SELECT * FROM departments WHERE department_id = ? ${scopeWhere.sql}`;
    const [rows] = await pool.query(sql, [id, ...scopeWhere.params]);
    return rows[0];
}