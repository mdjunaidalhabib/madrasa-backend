/* =========================================================
   MADRASA SaaS — ENTERPRISE COMPLETE DATABASE
   Multi-Tenant + Modules + Features + Classes
   ========================================================= */

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS feature_permissions;
DROP TABLE IF EXISTS module_features;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS madrasa_modules;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS madrasa_divisions;
DROP TABLE IF EXISTS divisions;
DROP TABLE IF EXISTS madrasa_subscriptions;
DROP TABLE IF EXISTS plans;
DROP TABLE IF EXISTS madrasas;
DROP TABLE IF EXISTS super_admins;

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================
-- SUPER ADMINS
-- ========================================================

CREATE TABLE super_admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO super_admins (name,email,password_hash,is_active)
VALUES (
'Platform Owner',
'admin@madrasa.com',
'$2b$10$hdkD7VdtWB37ri6TAWE9OusOlz5tmudkBM3O3vQerC71OZ9Qje.Fy',
1
);

-- ========================================================
-- MADRASAS
-- ========================================================

CREATE TABLE madrasas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address VARCHAR(255),
  slug VARCHAR(100) UNIQUE NOT NULL,

  student_limit INT DEFAULT 100,
  user_limit INT DEFAULT 5,

  is_active TINYINT DEFAULT 1,
  deleted_at TIMESTAMP NULL DEFAULT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================================================
-- PLANS
-- ========================================================

CREATE TABLE plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,

  student_limit INT NOT NULL,
  user_limit INT NOT NULL,

  duration_days INT DEFAULT 365,
  price DECIMAL(10,2) DEFAULT 0,

  is_active TINYINT DEFAULT 1,

  deleted_at TIMESTAMP NULL DEFAULT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB;

INSERT INTO plans
(name, student_limit, user_limit, duration_days, price, is_active)
VALUES
('Basic',100,5,365,2000,1),
('Standard',300,10,365,5000,1),
('Premium',1000,50,365,12000,1);

-- ========================================================
-- SUBSCRIPTIONS
-- ========================================================

CREATE TABLE madrasa_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  madrasa_id INT NOT NULL,
  plan_id INT NOT NULL,

  start_date DATE,
  end_date DATE,

  is_active TINYINT DEFAULT 1,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- PAYMENTS
-- ========================================================

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,

  madrasa_id INT,
  subscription_id INT,

  amount DECIMAL(10,2),
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),

  status ENUM('pending','paid','failed') DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================================================
-- DIVISIONS
-- ========================================================

CREATE TABLE divisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(50) UNIQUE,
  name VARCHAR(100),
  name_bn VARCHAR(100)
) ENGINE=InnoDB;

INSERT INTO divisions (key_name,name,name_bn) VALUES
('nurani','Nurani','নূরানী'),
('nazera_hifz','Nazera/Hifz','নাযেরা/হিফজ'),
('kitab','Kitab','কিতাব'),
('takhassus','Takhassus','তাখাসসুস');

-- ========================================================
-- CLASSES (NEW)
-- ========================================================

CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,

  division_id INT,
  name VARCHAR(100),
  name_bn VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (division_id)
  REFERENCES divisions(id)
  ON DELETE CASCADE
) ENGINE=InnoDB;

-- Default Classes Seed

INSERT INTO classes (division_id,name,name_bn) VALUES

-- Nurani
(1,'Child','শিশু'),
(1,'First','প্রথম'),
(1,'Second','দ্বিতীয়'),
(1,'Third','তৃতীয়'),

-- Nazera/Hifz
(2,'Hifz','হিফজ'),
(2,'Nazera','নাযেরা'),

-- Kitab
(3,'Urdu','উর্দু'),
(3,'Taisir','তাইসির'),
(3,'Mizan','মিজান'),
(3,'Nahbemir','নাহবেমীর'),
(3,'Hedayatun Nahw','হেদায়াতুন নাহু'),
(3,'Kafiya','কাফিয়া'),
(3,'Sharhe Bekaya','শরহে বেকায়া'),
(3,'Jalalain','জালালাইন'),
(3,'Mishkat','মিশকাত'),
(3,'Dawra','দাওরা'),

-- Takhassus
(4,'Ifta','ইফতা'),
(4,'Hadith','হাদিস');

-- ========================================================
-- MODULES
-- ========================================================

CREATE TABLE modules (
  id INT AUTO_INCREMENT PRIMARY KEY,

  key_name VARCHAR(50) UNIQUE,
  name VARCHAR(100),
  name_bn VARCHAR(100),

  group_name VARCHAR(100),

  is_active TINYINT DEFAULT 1
) ENGINE=InnoDB;

INSERT INTO modules (key_name,name,name_bn,group_name) VALUES
('dashboard','Dashboard','ড্যাশবোর্ড','core'),
('admission','Admission','ভর্তি বিভাগ','core'),
('accounts','Accounts','হিসাব বিভাগ','core'),
('students','Students','ছাত্রসমূহ','core'),
('users','Users','ইউজারস','core'),
('settings','Settings','সেটিং','core'),
('talimat','Talimat','তালিমাত','education'),
('activity','Activity Log','অ্যাক্টিভিটি লগ','core');

-- ========================================================
-- MODULE FEATURES
-- ========================================================

CREATE TABLE module_features (
  id INT AUTO_INCREMENT PRIMARY KEY,

  module_id INT,

  key_name VARCHAR(100),
  name VARCHAR(150),
  name_bn VARCHAR(150),

  sort_order INT DEFAULT 0,

  FOREIGN KEY (module_id)
  REFERENCES modules(id)
  ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO module_features (module_id,key_name,name,name_bn,sort_order) VALUES

-- Talimat
(7,'class_panel','Class Panel','ক্লাস প্যানেল',1),
(7,'results','Results','রেজাল্ট',2),
(7,'id_card','ID Card','আইডি কার্ড',3),
(7,'admit_card','Admit Card','প্রবেশ পত্র',4),
(7,'certificate','Certificate','প্রত্যয়ন পত্র',5),
(7,'transfer_letter','Transfer Letter','ছাড় পত্র',6),

-- Admission
(2,'new_admission','New Admission','নতুন ভর্তি',1),
(2,'students','Students','ছাত্রসমূহ',2),

-- Accounts
(3,'income','Income','আয়/রশিদ জমা',1),
(3,'expense','Expense','ব্যয়/ভাউচার তৈরী',2),
(3,'report','Report','আয় ব্যয় রিপোর্ট',3);

-- ========================================================
-- PERMISSIONS
-- ========================================================

CREATE TABLE permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,

  key_name VARCHAR(100) UNIQUE,
  name VARCHAR(100)
) ENGINE=InnoDB;

INSERT INTO permissions (key_name,name) VALUES
('students.read','View Students'),
('students.create','Create Students'),
('students.update','Update Students'),
('students.delete','Delete Students'),
('users.read','View Users'),
('users.create','Create Users'),
('accounts.read','View Accounts'),
('accounts.create','Create Accounts');

-- ========================================================
-- ROLES
-- ========================================================

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,

  madrasa_id INT,
  key_name VARCHAR(50),
  name_bn VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================================================
-- ROLE PERMISSIONS
-- ========================================================

CREATE TABLE role_permissions (
  role_id INT,
  permission_id INT,

  PRIMARY KEY (role_id,permission_id),

  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- USERS
-- ========================================================

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,

  madrasa_id INT,

  name VARCHAR(200),
  email VARCHAR(200),

  password_hash VARCHAR(255),

  role_id INT,

  is_active TINYINT DEFAULT 1,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_email (madrasa_id,email)
) ENGINE=InnoDB;

-- ========================================================
-- STUDENTS
-- ========================================================

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,

  madrasa_id INT,
  division_id INT,
  class_id INT,

  name_bn VARCHAR(200),

  is_active TINYINT DEFAULT 1,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================================================
-- ACCOUNTS
-- ========================================================

CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,

  madrasa_id INT,

  type ENUM('income','expense'),

  amount DECIMAL(10,2),

  description VARCHAR(255),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================================================
-- ACTIVITY LOGS
-- ========================================================

CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,

  madrasa_id INT,
  user_id INT,

  action VARCHAR(100),
  entity VARCHAR(100),
  entity_id INT,

  details TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;