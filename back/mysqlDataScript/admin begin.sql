-- =========================================
--   INITIAL RBAC + ADMIN SEED SCRIPT
-- =========================================

START TRANSACTION;

-- =========================================
-- 1️⃣ ROLES
-- =========================================

INSERT INTO roles (role_name, description)
SELECT 'ADMIN', 'Full system access'
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE role_name = 'ADMIN'
);

INSERT INTO roles (role_name, description)
SELECT 'MANAGER', 'Manage contacts'
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE role_name = 'MANAGER'
);

INSERT INTO roles (role_name, description)
SELECT 'USER', 'Basic access'
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE role_name = 'USER'
);

-- =========================================
-- 2️⃣ PERMISSIONS
-- =========================================

INSERT INTO permissions (perm_key, module_name, action_name)
SELECT * FROM (
    SELECT 'USER_CREATE','USER','CREATE' UNION ALL
    SELECT 'USER_EDIT','USER','EDIT' UNION ALL
    SELECT 'USER_DELETE','USER','DELETE' UNION ALL
    SELECT 'USER_VIEW','USER','VIEW' UNION ALL
    SELECT 'CONTACT_CREATE','CONTACT','CREATE' UNION ALL
    SELECT 'CONTACT_EDIT','CONTACT','EDIT' UNION ALL
    SELECT 'CONTACT_DELETE','CONTACT','DELETE' UNION ALL
    SELECT 'CONTACT_VIEW','CONTACT','VIEW' UNION ALL
    SELECT 'ROLE_MANAGE','ROLE','MANAGE' UNION ALL
    SELECT 'LOG_VIEW','LOG','VIEW'
) AS tmp
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p WHERE p.perm_key = tmp.column1
);

-- =========================================
-- 3️⃣ CREATE ADMIN USER
-- =========================================

-- ⚠️ ضع هنا bcrypt hash حقيقي
-- pass  admin123
INSERT INTO users (username, password_hash, full_name, email, is_active)
SELECT 'admin',
       '$2b$10$DGMyNABh9jtzbLxskEB2DO3JULL6PE/N2EUymRYN1siyiuRCMM4di',
       'System Administrator',
       'admin@example.com',
       1
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'admin'
);

-- =========================================
-- 4️⃣ ASSIGN ALL PERMISSIONS TO ADMIN ROLE
-- =========================================

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p
WHERE r.role_name = 'ADMIN';

-- =========================================
-- 5️⃣ ASSIGN ADMIN ROLE TO ADMIN USER
-- =========================================

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.user_id, r.role_id
FROM users u
JOIN roles r
WHERE u.username = 'admin'
AND r.role_name = 'ADMIN';

COMMIT;

-- =========================================
-- DONE
-- =========================================