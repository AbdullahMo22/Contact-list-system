const pool = require('../config/db.js');

exports.getPermissions = async () => {
    const sql = `SELECT * FROM permissions ORDER BY perm_key`;
    const [rows] = await pool.query(sql);
    return rows;
};

exports.getPermissionById = async (permissionId) => {
    const sql = `SELECT * FROM permissions WHERE permission_id = ?`;
    const [rows] = await pool.query(sql, [permissionId]);
    return rows[0];
};

exports.getPermissionsByUserId = async (userId) => {
    const sql = `
    SELECT DISTINCT p.perm_key
    FROM permissions p
    JOIN role_permissions rp ON p.permission_id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = ?
    `;
    const [rows] = await pool.query(sql, [userId]);
    return rows.map(row => row.perm_key);
};

// Legacy functions for backward compatibility
exports.getAllPermissions = async () => {
    const [rows] = await pool.query(`select * from permissions`);
    return rows;
};

exports.createPermission = async (permKey, module_name, action_name) => {
    const [result] = await 
    pool.query("insert into permissions(perm_key,module_name,action_name) values(?,?,?)"
        , [permKey, module_name, action_name]);
    return result.insertId;
}

exports.deletePermission = async (permId) => {
    await pool.query("delete from permissions where permission_id=?", [permId]);
}

exports.updatePermission = async (permId, permKey, module_name, action_name) => {
    let fields = [];
    let params = [];

    if (permKey !== undefined) {
        fields.push("perm_key=?");
        params.push(permKey);
    }

    if (module_name !== undefined) {
        fields.push("module_name=?");
        params.push(module_name);
    }

    if (action_name !== undefined) {
        fields.push("action_name=?");
        params.push(action_name);
    }

    if (fields.length === 0) return;

    const query = `UPDATE permissions SET ${fields.join(", ")} WHERE permission_id=?`;
    params.push(permId);

    await pool.query(query, params);
};

exports.roleHasPermission = async (roleId, permId) => {
    const [rows] = await pool.query("select * from role_permissions where role_id=? and permission_id=?", [roleId, permId]);
    return rows.length > 0;
}

exports.assignPermissionToRole = async (roleId, permId) => {
    await pool.query("insert into role_permissions(role_id,permission_id) values(?,?)", [roleId, permId]);
}

exports.removePermissionFromRole = async (roleId, permId) => {
    await pool.query("delete from role_permissions where role_id=? and permission_id=?", [roleId, permId]);
}
