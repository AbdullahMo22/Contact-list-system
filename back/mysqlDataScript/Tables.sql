CREATE TABLE users (
  user_id int UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username NVARCHAR(100) NOT NULL,
  password_hash NVARCHAR(255) NOT NULL,
  full_name NVARCHAR(150),
  email NVARCHAR(200),
  is_active TINYINT(1) DEFAULT 1,
  is_deleted TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  userAdd int,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  userUpdate int ,
  deleted_at DateTime ,
  userDelete int,
  UNIQUE KEY uq_username (username),
  UNIQUE KEY uq_email (email)
) ENGINE=InnoDB;

CREATE TABLE roles (
  role_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_name NVARCHAR(100) NOT NULL,
  description NVARCHAR(255),
  is_deleted TINYINT(1) DEFAULT 0,
  UNIQUE KEY uq_role_name (role_name)
) ENGINE=InnoDB;


CREATE TABLE permissions (
  permission_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  perm_key nVARCHAR(150) NOT NULL,
  module_name nVARCHAR(100) NOT NULL,
  action_name nVARCHAR(50) NOT NULL,
  UNIQUE KEY uq_perm_key (perm_key)
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  user_id INT UNSIGNED NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE TABLE hotels (
  hotel_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hotel_name nvarchar(200) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  is_deleted TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  userAdd int,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  userUpdate int ,
  deleted_at DateTime ,
  userDelete int,
  UNIQUE KEY uq_hotel_name (hotel_name)
) ENGINE=InnoDB;

ALTER TABLE hotels 
ADD COLUMN location VARCHAR(150) AFTER hotel_name;

CREATE TABLE departments (
  department_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hotel_id INT UNSIGNED NOT NULL,
  department_name nvarchar(200) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  is_deleted TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  userAdd int,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  userUpdate int ,
  deleted_at DateTime ,
  userDelete int,
  UNIQUE KEY uq_hotel_dept (hotel_id, department_name),
  FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
) ENGINE=InnoDB;

CREATE TABLE hotel_departments (
    hotel_id INT UNSIGNED NOT NULL,
    department_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (hotel_id, department_id),
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE user_hotels (
  user_id INT UNSIGNED NOT NULL,
  hotel_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, hotel_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE user_departments (
  user_id INT UNSIGNED NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, department_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE contacts (
  contact_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hotel_id INT UNSIGNED NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  full_name nvarchar(200) NOT NULL,
  job_title nvarchar(150),
  phone nvarchar(50),
  email nvarchar(200),
  notes TEXT,
  is_active TINYINT(1) DEFAULT 1,
  is_deleted TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    userAdd int,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  userUpdate int ,
  deleted_at DateTime ,
  userDelete int,
  KEY idx_scope (hotel_id, department_id),
  FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id),
  FOREIGN KEY (department_id) REFERENCES departments(department_id)
) ENGINE=InnoDB;
CREATE TABLE cards (
  card_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contact_id INT UNSIGNED NOT NULL,
  card_number nvarchar(100) NOT NULL,
  card_type nvarchar(50),
  status ENUM('ACTIVE','DISABLED') DEFAULT 'ACTIVE',
  issued_at DATETIME,
  expires_at DATETIME,  
  is_active TINYINT(1) DEFAULT 1,
  is_deleted TINYINT(1) DEFAULT 0,  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 userAdd int,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  userUpdate int ,
  deleted_at DateTime ,
  userDelete int,
  UNIQUE KEY uq_card_number (card_number),
  FOREIGN KEY (contact_id) REFERENCES contacts(contact_id)
) ENGINE=InnoDB;


CREATE TABLE audit_logs (
  log_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  timestamp_utc DATETIME DEFAULT CURRENT_TIMESTAMP,

  user_id INT UNSIGNED NULL,
   action_name nvarchar(50) NOT NULL,
  entity_type nvarchar(50),
  entity_id nvarchar(100),
  success TINYINT(1) DEFAULT 1,
  error_message TEXT,
  ip_address nvarchar(45),
  mac_address nvarchar(50),
  device_name nvarchar(150),
  old_values_json JSON,
  new_values_json JSON,
  KEY idx_time (timestamp_utc),
  KEY idx_user (user_id, timestamp_utc),
  KEY idx_action (action_name),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE SET NULL
) ENGINE=InnoDB;



    CREATE TABLE IF NOT EXISTS user_hotel_departments (
      user_id        INT UNSIGNED NOT NULL,
      hotel_id       INT UNSIGNED NOT NULL,
      department_id  INT UNSIGNED NOT NULL,
      PRIMARY KEY (user_id, hotel_id, department_id),
      FOREIGN KEY (user_id)       REFERENCES users(user_id)             ON DELETE CASCADE,
      FOREIGN KEY (hotel_id)      REFERENCES hotels(hotel_id)           ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE
    ) ENGINE=InnoDB