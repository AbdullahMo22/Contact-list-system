const pool = require('../config/db.js');

exports.getRoles = async () => {
    const sql = `
  SELECT 
      r.role_id,
      r.role_name,
      r.description,
      r.is_deleted,
      COUNT(ur.user_id) AS users_count
    FROM roles r
    LEFT JOIN user_roles ur ON ur.role_id = r.role_id
    WHERE r.is_deleted = 0
    GROUP BY r.role_id, r.role_name, r.description, r.is_deleted
    ORDER BY r.role_id`;
    const [rows] = await pool.query(sql);
    return rows;
};

exports.getRoleById = async (roleId) => {
    const sql = `SELECT * FROM roles WHERE role_id = ? AND is_deleted = 0`;
    const [rows] = await pool.query(sql, [roleId]);
    return rows[0];
};

exports.createRole = async (role_name, role_description) => {
    const sql = `INSERT INTO roles (role_name, description) VALUES (?, ?)`;
    const [rows] = await pool.query(sql, [role_name, role_description]);
    return rows.insertId;
};

exports.updateRole = async (roleId, role_name, role_description) => {
    const fields = [];
    const values = [];
    
    if (role_name !== undefined) {
        fields.push('role_name = ?');
        values.push(role_name);
    }
    if (role_description !== undefined) {
        fields.push('description = ?');
        values.push(role_description);
    }

    
    if (fields.length === 0) return false;
    
    const sql = `UPDATE roles SET ${fields.join(', ')} WHERE role_id = ? AND is_deleted = 0`;
    values.push(roleId);
     console.log("Executing SQL:", sql, "with values:", values);
    const [rows] = await pool.query(sql, values);
    return rows.affectedRows > 0;
};

exports.deleteRole = async (roleId) => {
    const sql = `DELETE FROM roles WHERE role_id = ? AND is_deleted = 0`;
    const [rows] = await pool.query(sql, [roleId]);
    return rows.affectedRows > 0;
};

// Role Permissions Management
exports.getRolePermissions = async (roleId) => {
    const sql = `
    SELECT p.permission_id, p.perm_key, p.module_name, p.action_name
    FROM permissions p
    JOIN role_permissions rp ON p.permission_id = rp.permission_id
    WHERE rp.role_id = ?
    ORDER BY p.perm_key
    `;
    const [rows] = await pool.query(sql, [roleId]);
    return rows;
};

exports.assignPermissionToRole = async (roleId, permissionId) => {
    // Check if already assigned
    const checkSql = `SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?`;
    const [existing] = await pool.query(checkSql, [roleId, permissionId]);
    
    if (existing.length > 0) {
        throw new Error('Role already has this permission');
    }
    
    const sql = `INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)`;
    const [rows] = await pool.query(sql, [roleId, permissionId]);
    return rows.affectedRows > 0;
};

exports.removePermissionFromRole = async (roleId, permissionId) => {
    const sql = `DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?`;
    const [rows] = await pool.query(sql, [roleId, permissionId]);
    return rows.affectedRows > 0;
};

exports.bulkSetRolePermissions = async (roleId, permissionIds) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
        if (permissionIds && permissionIds.length > 0) {
            const values = permissionIds.map(pid => [roleId, pid]);
            await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [values]);
        }
        await connection.commit();
        return true;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

exports.roleExists = async (role_name, excludeId = null) => {
    let sql = `SELECT role_id FROM roles WHERE role_name = ? AND is_deleted = 0`;
    const params = [role_name];
    
    if (excludeId) {
        sql += ` AND role_id != ?`;
        params.push(excludeId);
    }
    
    const [rows] = await pool.query(sql, params);
    return rows.length > 0;
};

exports.getOldRoleById = async (roleId) => {
    const sql = `SELECT * FROM roles WHERE role_id = ?`;
    const [rows] = await pool.query(sql, [roleId]);
    return rows[0];
};

// Legacy functions for backward compatibility
exports.getRolesByUserId = async (userId) => {
    const [rows] = await pool.query(`    
         SELECT r.role_id, r.role_name
    FROM roles r
    JOIN user_roles ur ON r.role_id = ur.role_id
    WHERE ur.user_id = ? AND r.is_deleted = 0`, [userId]);
    return rows;
};

exports.addNewRole = async (roleName, description) => {
    const [result] = await pool.query("insert into roles(role_name,description) values(?,?)", [roleName, description]);
    return result.insertId;
}

exports.getAllRoles = async () => {
    const [rows] = await pool.query("select role_id,role_name,description from roles where is_deleted=0");
    return rows;
}

exports.getRoleByName = async (roleName) => {
    const [rows] = await pool.query("select role_id,role_name from roles where role_name=? and is_deleted=0", [roleName]);
    return rows[0];
}