-- Create initial admin user
-- Password: password123
-- Hash: $2b$12$4xEw2GUHM7i8JP7Wkuzr.uD9kEGFHXhuNeGaARxfBIIOYHiRaAjQi

-- Create IT department if not exists
INSERT INTO departments (name, description, created_at, updated_at)
SELECT 'IT', 'IT Departmanı', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'IT');

-- Create Admin role if not exists
INSERT INTO roles (name, description, created_at, updated_at)
SELECT 'Admin', 'Yönetici rolü', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Admin');

-- Create admin user if not exists
INSERT INTO users (email, password_hash, full_name, is_active, department_id, created_at, updated_at)
SELECT 
    'admin@3-d.com.tr',
    '$2b$12$4xEw2GUHM7i8JP7Wkuzr.uD9kEGFHXhuNeGaARxfBIIOYHiRaAjQi',
    'Admin User',
    1,
    (SELECT id FROM departments WHERE name = 'IT' LIMIT 1),
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@3-d.com.tr');

-- Assign Admin role to user
INSERT INTO user_roles (user_id, role_id)
SELECT 
    u.id,
    r.id
FROM users u, roles r
WHERE u.email = 'admin@3-d.com.tr' 
  AND r.name = 'Admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

