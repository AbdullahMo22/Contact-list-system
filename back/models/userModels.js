const pool = require('../config/db');

// RBAC User Management
exports.getUserWithRoles = async (id) => {
    const sql = `
    SELECT 
        u.*,
        GROUP_CONCAT(DISTINCT r.role_name) as roles,
        GROUP_CONCAT(DISTINCT p.perm_key) as permissions
    FROM users u
    LEFT JOIN user_roles ur ON u.user_id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.role_id
    LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
    LEFT JOIN permissions p ON rp.permission_id = p.permission_id
    WHERE u.user_id = ? AND u.is_deleted = 0 AND u.is_active = 1
    GROUP BY u.user_id
    `;
    const [rows] = await pool.query(sql, [id]);

    if (rows.length === 0) return null;

    const user = rows[0];
    user.roles = user.roles ? user.roles.split(',') : [];
    user.permissions = user.permissions ? user.permissions.split(',') : [];
    user.isAdmin = user.roles.some(r => String(r).toUpperCase() === 'ADMIN' || String(r).toUpperCase() === 'ADMIN_MASTER');

    return user;
};

exports.getUserById = async (userId) => {
    const [rows] = await pool.query("select * from users where user_id=? and is_deleted=0", [userId]);
    return rows[0];
}

exports.getUserByEmail = async (email) => {
    const [rows] = await pool.query("select * from users where email=? and is_deleted=0", [email]);
    return rows[0];
}

exports.createUser = async ({ username, email, passwordHash, fullName, userAdd }) => {
  const sql = `
    INSERT INTO users (username, email, password_hash, full_name, userAdd)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(sql, [username, email, passwordHash, fullName, userAdd]);
  return result.insertId;
};
exports.updateUser = async (userId, updateData) => {
    const fields = [];
    const values = [];

    Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
    });

    if (fields.length === 0) return false;

    fields.push('updated_at = NOW()');
    values.push(userId);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ? AND is_deleted = 0`;
    const [rows] = await pool.query(sql, values);
    return rows.affectedRows > 0;
};
exports.toggleUserrActive = async (id, userUpdate) => {
    const sql = `UPDATE users SET is_active = NOT is_active, userUpdate = ?, updated_at = NOW() WHERE user_id = ? AND is_deleted = 0`;
    const [rows] = await pool.query(sql, [userUpdate, id]);
    return rows.affectedRows > 0;
}
exports.deleteUser = async (userId, adminId) => {
    const sql = `UPDATE users SET is_deleted = 1, userDelete = ?, deleted_at = NOW() WHERE user_id = ? AND is_deleted = 0`;
    const [rows] = await pool.query(sql, [adminId, userId]);
    return rows.affectedRows > 0;
};

exports.updateUserPassword = async (userId, hashedPassword) => {
    const sql = `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ? AND is_deleted = 0`;
    const [rows] = await pool.query(sql, [hashedPassword, userId]);
    return rows.affectedRows > 0;
};

exports.findUserByUsername = async (username) => {
    const [rows] = await pool.query("select user_id, username, password_hash, full_name, email from users where username=? and is_deleted=0 ", [username]);
    return rows[0];
}

exports.findUserById = async (userId) => {
    const [rows] = await pool.query("select user_id, username, full_name, email ,is_active from users where user_id=? and is_deleted=0 ", [userId]);
    return rows[0];
}

exports.getAllUsers = async () => {
    const [rows] = await pool.query("select user_id, username, full_name, email ,is_active from users where is_deleted=0  ");
    return rows;
}

// Returns the nested user+roles+permissions shape required by /auth/me
exports.getUserWithRolesNested = async (userId) => {
    // 1. Basic user row
    const [userRows] = await pool.query(
        `SELECT user_id, username, email, full_name
         FROM users
         WHERE user_id = ? AND is_deleted = 0  `,
        [userId]
    );
    if (userRows.length === 0) return null;
    const row = userRows[0];

    // 2. Roles for this user
    const [roleRows] = await pool.query(
        `SELECT r.role_id AS id, r.role_name AS name, r.description AS description
         FROM roles r
         JOIN user_roles ur ON r.role_id = ur.role_id
         WHERE ur.user_id = ? AND r.is_deleted = 0`,
        [userId]
    );

    // 3. Permissions per role
    const roles = await Promise.all(
        roleRows.map(async (role) => {
            const [permRows] = await pool.query(
                `SELECT p.permission_id AS id, p.perm_key AS name
                 FROM permissions p
                 JOIN role_permissions rp ON p.permission_id = rp.permission_id
                 WHERE rp.role_id = ?`,
                [role.id]
            );
            return { ...role, permissions: permRows };
        })
    );

    return {
        id: row.user_id,
        username: row.username,
        email: row.email,
        full_name: row.full_name,
        roles,
    };
};

// User Roles Management
exports.getUserRoles = async (userId) => {
    const sql = `
    SELECT r.role_id, r.role_name, r.description
    FROM roles r
    JOIN user_roles ur ON r.role_id = ur.role_id
    WHERE ur.user_id = ? AND r.is_deleted = 0
    `;
    const [rows] = await pool.query(sql, [userId]);
    return rows;
};

exports.assignRoleToUser = async (userId, roleId) => {
    const checkSql = `SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = ?`;
    const [existing] = await pool.query(checkSql, [userId, roleId]);

    if (existing.length > 0) {
        throw new Error('User already has this role');
    }

    const sql = `INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`;
    const [rows] = await pool.query(sql, [userId, roleId]);
    return rows.affectedRows > 0;
};

exports.removeRoleFromUser = async (userId, roleId) => {
    const sql = `DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`;
    const [rows] = await pool.query(sql, [userId, roleId]);
    return rows.affectedRows > 0;
};

// User Scope Management using separate tables
exports.updateUserScope = async (userId, hotelIds, departmentIds, hotelDeptPairs) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.execute('DELETE FROM user_hotels WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM user_departments WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM user_hotel_departments WHERE user_id = ?', [userId]);

        if (hotelIds && hotelIds.length > 0) {
            const hotelValues = hotelIds.map(hotelId => [userId, hotelId]);
            await connection.query('INSERT INTO user_hotels (user_id, hotel_id) VALUES ?', [hotelValues]);
        }

        if (departmentIds && departmentIds.length > 0) {
            const deptValues = departmentIds.map(deptId => [userId, deptId]);
            await connection.query('INSERT INTO user_departments (user_id, department_id) VALUES ?', [deptValues]);
        }

        if (hotelDeptPairs && hotelDeptPairs.length > 0) {
            const pairValues = hotelDeptPairs.map(({ hotel_id, department_id }) => [userId, hotel_id, department_id]);
            await connection.query(
                'INSERT INTO user_hotel_departments (user_id, hotel_id, department_id) VALUES ?',
                [pairValues]
            );
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

exports.getUserScope = async (userId) => {
    const [hotelRows] = await pool.query('SELECT hotel_id FROM user_hotels WHERE user_id = ?', [userId]);
    const [deptRows]  = await pool.query('SELECT department_id FROM user_departments WHERE user_id = ?', [userId]);
    const [pairRows]  = await pool.query(
        'SELECT hotel_id, department_id FROM user_hotel_departments WHERE user_id = ?',
        [userId]
    );

    return {
        hotelIds:      hotelRows.map(r => r.hotel_id),
        departmentIds: deptRows.map(r => r.department_id),
        hotelDeptPairs: pairRows.map(r => ({ hotel_id: r.hotel_id, department_id: r.department_id })),
    };
};

// Admin User Management
exports.getUsers = async (filters = {}) => {
    const { status, search, limit, offset } = filters;

    let whereClauses = ['is_deleted = 0'];
    let params = [];

    if (status !== undefined) {
        whereClauses.push('is_active = ?');
        params.push(status);
    }

    if (search) {
        whereClauses.push('(username LIKE ? OR email LIKE ? OR full_name LIKE ?)');
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
    }

    const whereClause = whereClauses.join(' AND ');

    const sql = `
    SELECT user_id, username, email, full_name, is_active, 
           created_at, updated_at
    FROM users 
    WHERE ${whereClause} 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const [rows] = await pool.query(sql, params);
    return rows;
};

exports.getUsersCount = async (filters = {}) => {
    const { status, search } = filters;

    let whereClauses = ['is_deleted = 0'];
    let params = [];

    if (status !== undefined) {
        whereClauses.push('is_active = ?');
        params.push(status);
    }

    if (search) {
        whereClauses.push('(username LIKE ? OR email LIKE ? OR full_name LIKE ?)');
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
    }

    const whereClause = whereClauses.join(' AND ');
    const sql = `SELECT COUNT(*) as count FROM users WHERE ${whereClause}`;
    const [rows] = await pool.query(sql, params);
    return rows[0].count;
};
