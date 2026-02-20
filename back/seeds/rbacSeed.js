const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config/.env' });
const bcrypt = require('bcryptjs');

async function seedRBAC() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('🌱 Starting RBAC seeding...');

        // 1. Create roles
        console.log('📝 Creating roles...');
        await connection.execute(`
            INSERT IGNORE INTO roles (role_name, description) VALUES 
            ('admin', 'System Administrator with full access'),
            ('manager', 'Hotel Manager with management permissions'),
            ('staff', 'Hotel Staff with limited permissions')
        `);

        // 2. Create permissions
        console.log('🔑 Creating permissions...');
        const permissions = [
            ['CONTACT_VIEW', 'Contact', 'View'],
            ['CONTACT_CREATE', 'Contact', 'Create'],
            ['CONTACT_EDIT', 'Contact', 'Edit'],
            ['CONTACT_DELETE', 'Contact', 'Delete'],
            ['HOTEL_VIEW', 'Hotel', 'View'],
            ['HOTEL_CREATE', 'Hotel', 'Create'],
            ['HOTEL_EDIT', 'Hotel', 'Edit'],
            ['HOTEL_DELETE', 'Hotel', 'Delete'],
            ['DEPARTMENT_VIEW', 'Department', 'View'],
            ['DEPARTMENT_CREATE', 'Department', 'Create'],
            ['DEPARTMENT_EDIT', 'Department', 'Edit'],
            ['DEPARTMENT_DELETE', 'Department', 'Delete'],
            ['USER_VIEW', 'User', 'View'],
            ['USER_CREATE', 'User', 'Create'],
            ['USER_EDIT', 'User', 'Edit'],
            ['USER_DELETE', 'User', 'Delete'],
            ['ROLE_MANAGE', 'Role', 'Manage'],
            ['LOG_VIEW', 'Log', 'View']
        ];

        for (const [perm_key, module_name, action_name] of permissions) {
            await connection.execute(`
                INSERT IGNORE INTO permissions (perm_key, module_name, action_name) VALUES (?, ?, ?)
            `, [perm_key, module_name, action_name]);
        }

        // 3. Get role and permission IDs
        const [adminRole] = await connection.execute('SELECT role_id FROM roles WHERE role_name = "admin"');
        const [managerRole] = await connection.execute('SELECT role_id FROM roles WHERE role_name = "manager"');
        const [staffRole] = await connection.execute('SELECT role_id FROM roles WHERE role_name = "staff"');

        const adminRoleId = adminRole[0].role_id;
        const managerRoleId = managerRole[0].role_id;
        const staffRoleId = staffRole[0].role_id;

        // 4. Assign all permissions to admin role
        console.log('👨‍💼 Assigning permissions to admin role...');
        const [allPermissions] = await connection.execute('SELECT permission_id FROM permissions');
        for (const permission of allPermissions) {
            await connection.execute(`
                INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)
            `, [adminRoleId, permission.permission_id]);
        }

        // 5. Assign manager permissions (all except ROLE_MANAGE and LOG_VIEW)
        console.log('👨‍💼 Assigning permissions to manager role...');
        const managerPerms = [
            'CONTACT_VIEW', 'CONTACT_CREATE', 'CONTACT_EDIT', 'CONTACT_DELETE',
            'HOTEL_VIEW', 'HOTEL_EDIT',
            'DEPARTMENT_VIEW', 'DEPARTMENT_CREATE', 'DEPARTMENT_EDIT', 'DEPARTMENT_DELETE',
            'USER_VIEW'
        ];
        for (const permKey of managerPerms) {
            const [perm] = await connection.execute('SELECT permission_id FROM permissions WHERE perm_key = ?', [permKey]);
            if (perm.length > 0) {
                await connection.execute(`
                    INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)
                `, [managerRoleId, perm[0].permission_id]);
            }
        }

        // 6. Assign staff permissions (only view permissions)
        console.log('👨‍💼 Assigning permissions to staff role...');
        const staffPerms = ['CONTACT_VIEW', 'HOTEL_VIEW', 'DEPARTMENT_VIEW'];
        for (const permKey of staffPerms) {
            const [perm] = await connection.execute('SELECT permission_id FROM permissions WHERE perm_key = ?', [permKey]);
            if (perm.length > 0) {
                await connection.execute(`
                    INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)
                `, [staffRoleId, perm[0].permission_id]);
            }
        }

        // 7. Create demo users
        console.log('👤 Creating demo users...');
        const hashedPassword = await bcrypt.hash('123456', 12);
        
        // Admin user
        const [adminResult] = await connection.execute(`
            INSERT IGNORE INTO users (username, email, password_hash, full_name) 
            VALUES ('admin', 'admin@hotel.com', ?, 'System Administrator')
        `, [hashedPassword]);

        // Manager user
        const [managerResult] = await connection.execute(`
            INSERT IGNORE INTO users (username, email, password_hash, full_name) 
            VALUES ('manager', 'manager@hotel.com', ?, 'Hotel Manager')
        `, [hashedPassword]);

        // Staff user
        const [staffResult] = await connection.execute(`
            INSERT IGNORE INTO users (username, email, password_hash, full_name) 
            VALUES ('staff', 'staff@hotel.com', ?, 'Hotel Staff')
        `, [hashedPassword]);

        // 8. Assign roles to users
        console.log('🔗 Assigning roles to users...');
        const [adminUser] = await connection.execute('SELECT user_id FROM users WHERE username = "admin"');
        const [managerUser] = await connection.execute('SELECT user_id FROM users WHERE username = "manager"');
        const [staffUser] = await connection.execute('SELECT user_id FROM users WHERE username = "staff"');

        if (adminUser.length > 0) {
            await connection.execute(`
                INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)
            `, [adminUser[0].user_id, adminRoleId]);
        }

        if (managerUser.length > 0) {
            await connection.execute(`
                INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)
            `, [managerUser[0].user_id, managerRoleId]);
        }

        if (staffUser.length > 0) {
            await connection.execute(`
                INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)
            `, [staffUser[0].user_id, staffRoleId]);
        }

        // 9. Set user scope using separate tables
        console.log('🎯 Setting user scope...');
        
        // Manager scope: hotels 1,2 and departments 1,2,3
        if (managerUser.length > 0) {
            const managerId = managerUser[0].user_id;
            await connection.execute(`INSERT IGNORE INTO user_hotels (user_id, hotel_id) VALUES (?, 1), (?, 2)`, [managerId, managerId]);
            await connection.execute(`INSERT IGNORE INTO user_departments (user_id, department_id) VALUES (?, 1), (?, 2), (?, 3)`, [managerId, managerId, managerId]);
        }
        
        // Staff scope: hotel 1 and department 1 only
        if (staffUser.length > 0) {
            const staffId = staffUser[0].user_id;
            await connection.execute(`INSERT IGNORE INTO user_hotels (user_id, hotel_id) VALUES (?, 1)`, [staffId]);
            await connection.execute(`INSERT IGNORE INTO user_departments (user_id, department_id) VALUES (?, 1)`, [staffId]);
        }

        // 9. Create sample data for testing
        console.log('🏨 Creating sample hotels...');
        await connection.execute(`
            INSERT IGNORE INTO hotels (hotel_name, location) VALUES 
            ('Grand Hotel', 'New York'),
            ('Ocean View Resort', 'Miami'),
            ('Mountain Lodge', 'Colorado')
        `);

        console.log('🏢 Creating sample departments...');
        await connection.execute(`
            INSERT IGNORE INTO departments (hotel_id, department_name) VALUES 
            (1, 'Reception'),
            (1, 'Housekeeping'),
            (2, 'Restaurant'),
            (2, 'Pool Service'),
            (3, 'Ski Rental')
        `);

        console.log('📞 Creating sample contacts...');
        await connection.execute(`
            INSERT IGNORE INTO contacts (full_name, email, phone, hotel_id, department_id, job_title, notes) VALUES 
            ('John Smith', 'john@grandhotel.com', '555-0101', 1, 1, 'Front Desk Manager', 'Primary contact for reception'),
            ('Sarah Johnson', 'sarah@grandhotel.com', '555-0102', 1, 2, 'Housekeeping Supervisor', 'Available 24/7'),
            ('Mike Wilson', 'mike@resort.com', '555-0201', 2, 3, 'Head Chef', 'Specializes in seafood')
        `);

        console.log('✅ RBAC seeding completed successfully!');
        console.log('\n📋 Demo Users Created:');
        console.log('👑 Admin: admin@hotel.com / 123456 (Full system access)');
        console.log('👨‍💼 Manager: manager@hotel.com / 123456 (Hotels 1,2 | Departments 1,2,3)');
        console.log('👨‍💼 Staff: staff@hotel.com / 123456 (Hotel 1 | Department 1)');
        
        console.log('\n🔗 API Endpoints Available:');
        console.log('• POST /api/auth/login - User authentication');
        console.log('• GET /api/roles - View all roles (ROLE_MANAGE permission)');
        console.log('• POST /api/roles/:roleId/permissions - Assign permission to role');
        console.log('• POST /api/roles/users/:userId/roles - Assign role to user');
        console.log('• PUT /api/roles/users/:userId/scope - Update user scope');
        console.log('• GET /api/contacts - View contacts (scope-filtered)');
        console.log('• GET /api/hotels - View hotels (scope-filtered)');
        console.log('• GET /api/departments - View departments (scope-filtered)');

    } catch (error) {
        console.error('❌ Error seeding RBAC:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Run seeding if called directly
if (require.main === module) {
    seedRBAC()
        .then(() => {
            console.log('\n🎉 Database seeding completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Seeding failed:', error);
            process.exit(1);
        });
}

module.exports = seedRBAC;