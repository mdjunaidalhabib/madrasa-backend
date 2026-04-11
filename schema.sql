/* =========================================================
   MADRASA SaaS — ENTERPRISE COMPLETE DATABASE (UPDATED SAFE)
   Multi-Tenant + Modules + Features + Classes
   NO DROP TABLE — SAFE UPDATE
   ========================================================= */

SET FOREIGN_KEY_CHECKS = 0;

-- ========================================================
-- SUPER ADMINS
-- ========================================================

CREATE TABLE IF NOT EXISTS super_admins (
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
)
ON DUPLICATE KEY UPDATE name=name;

-- ========================================================
-- MADRASAS
-- ========================================================

CREATE TABLE IF NOT EXISTS madrasas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(120) UNIQUE NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(120),
  address VARCHAR(255),
  student_limit INT DEFAULT 100,
  user_limit INT DEFAULT 5,
  is_active TINYINT DEFAULT 1,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

-- ========================================================
-- PLANS
-- ========================================================

CREATE TABLE IF NOT EXISTS plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  student_limit INT NOT NULL,
  user_limit INT NOT NULL,
  duration_days INT DEFAULT 365,
  price DECIMAL(10,2) DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_plan_name (name)
) ENGINE=InnoDB;

INSERT INTO plans
(name, student_limit, user_limit, duration_days, price, is_active)
VALUES
('Basic',100,5,365,2000,1),
('Standard',300,10,365,5000,1),
('Premium',1000,50,365,12000,1)
ON DUPLICATE KEY UPDATE name=name;

-- ========================================================
-- SUBSCRIPTIONS
-- ========================================================

CREATE TABLE IF NOT EXISTS madrasa_subscriptions (
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

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  madrasa_id INT,
  subscription_id INT,
  amount DECIMAL(10,2),
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  status ENUM('pending','paid','failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES madrasa_subscriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB;



-- ========================================================
-- DIVISIONS
-- ========================================================

CREATE TABLE IF NOT EXISTS divisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(50) UNIQUE,
  name VARCHAR(100),
  name_bn VARCHAR(100)
) ENGINE=InnoDB;

INSERT INTO divisions (key_name,name,name_bn) VALUES
('nurani','Nurani','নূরানী'),
('nazera_hifz','Nazera/Hifz','নাযেরা/হিফজ'),
('kitab','Kitab','কিতাব'),
('takhassus','Takhassus','তাখাসসুস')
ON DUPLICATE KEY UPDATE name=name;


-- ========================================================
-- MADRASA DIVISIONS
-- ========================================================

CREATE TABLE IF NOT EXISTS madrasa_divisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  madrasa_id INT NOT NULL,
  division_id INT NOT NULL,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_madrasa_division (madrasa_id, division_id),

  FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE,
  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- ========================================================
-- CLASSES
-- ========================================================

CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  division_id INT,
  name VARCHAR(100),
  name_bn VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_division_class (division_id,name),

  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

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
(4,'Hadith','হাদিস')

ON DUPLICATE KEY UPDATE name=name;


-- ========================================================
-- MADRASA CLASSES
-- ========================================================

CREATE TABLE IF NOT EXISTS madrasa_classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  madrasa_id INT NOT NULL,
  class_id INT NOT NULL,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_madrasa_class (madrasa_id, class_id),

  FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- ========================================================
-- BOOKS
-- ========================================================

CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  name VARCHAR(150),
  name_bn VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_class_book (class_id, name),

  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- ========================================================
-- DEMO BOOKS DATA
-- ========================================================

INSERT INTO books (class_id,name,name_bn) VALUES

-- Mizan
(9,'Mizan Book','মিজান কিতাব'),
(9,'Sarf Book','সরফ'),
(9,'Nahw Book','নাহু'),

-- Nahbemir
(10,'Nahbemir','নাহবেমীর'),

-- Hedayatun Nahw
(11,'Hedayatun Nahw','হেদায়াতুন নাহু'),

-- Kafiya
(12,'Kafiya','কাফিয়া'),

-- Sharhe Bekaya
(13,'Sharhe Bekaya','শরহে বেকায়া'),

-- Jalalain
(14,'Tafsir Jalalain','তাফসির জালালাইন'),

-- Mishkat
(15,'Mishkat Sharif','মিশকাত শরিফ'),

-- Dawra
(16,'Sahih Bukhari','সহিহ বুখারি'),
(16,'Sahih Muslim','সহিহ মুসলিম'),
(16,'Tirmizi','তিরমিজি'),
(16,'Abu Dawood','আবু দাউদ')

ON DUPLICATE KEY UPDATE name=name;


-- ========================================================
-- MADRASA BOOKS
-- ========================================================

CREATE TABLE IF NOT EXISTS madrasa_books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  madrasa_id INT NOT NULL,
  book_id INT NOT NULL,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_madrasa_book (madrasa_id, book_id),

  FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- MODULES
-- ========================================================

CREATE TABLE IF NOT EXISTS modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(50) UNIQUE,
  name VARCHAR(100),
  name_bn VARCHAR(100),
  group_name VARCHAR(100),
  is_active TINYINT DEFAULT 1
) ENGINE=InnoDB;

INSERT INTO modules (key_name,name,name_bn,group_name) VALUES
('dashboard','Dashboard','ড্যাশবোর্ড','core'),
('ihtemam','ihtemam','ইহতিমাম','core'),
('talimat','Talimat','তালিমাত','education'),
('accounts','Accounts','হিসাব বিভাগ','core'),
('students','Students','ছাত্র বিভাগ','core'),
('admission','Admission','নতুন ভর্তি','core'),
('users','Users','ইউজারস','core'),
('settings','Settings','সেটিং','core'),
('activity','Activity Log','অ্যাক্টিভিটি লগ','core')
ON DUPLICATE KEY UPDATE name=name;

-- ========================================================
-- MODULE FEATURES
-- ========================================================

CREATE TABLE IF NOT EXISTS module_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT,
  key_name VARCHAR(100),
  name VARCHAR(150),
  name_bn VARCHAR(150),
  sort_order INT DEFAULT 0,
  UNIQUE KEY uniq_feature (module_id,key_name),
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO module_features (module_id,key_name,name,name_bn,sort_order) VALUES

-- Talimat
(3,'class_panel','Class Panel','ক্লাস প্যানেল',1),
(3,'results','Results','রেজাল্ট',2),
(3,'id_card','ID Card','আইডি কার্ড',3),
(3,'admit_card','Admit Card','প্রবেশ পত্র',4),
(3,'certificate','Certificate','প্রত্যয়ন পত্র',5),
(3,'transfer_letter','Transfer Letter','ছাড় পত্র',6),

-- Accounts
(4,'income','Income','আয়/রশিদ জমা',1),
(4,'expense','Expense','ব্যয়/ভাউচার তৈরী',2),
(4,'report','Report','আয় ব্যয় রিপোর্ট',3),

-- students
(5,'new_admission','New Admission','নতুন ভর্তি',1),
(5,'list','list','ছাত্রসমূহ',2)
ON DUPLICATE KEY UPDATE name=name;

-- ========================================================
-- MADRASA MODULES
-- ========================================================

CREATE TABLE IF NOT EXISTS madrasa_modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  madrasa_id INT NOT NULL,
  module_id INT NOT NULL,
  is_active TINYINT DEFAULT 1,
  UNIQUE KEY uniq_madrasa_module (madrasa_id,module_id),
  FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- PERMISSIONS
-- ========================================================

CREATE TABLE IF NOT EXISTS permissions (
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
('accounts.create','Create Accounts')
ON DUPLICATE KEY UPDATE name=name;

-- ========================================================
-- ROLES
-- ========================================================

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  madrasa_id INT,
  key_name VARCHAR(50),
  name_bn VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- ROLE PERMISSIONS
-- ========================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT,
  permission_id INT,
  PRIMARY KEY (role_id,permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- USERS
-- ========================================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  madrasa_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active TINYINT DEFAULT 1,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_email_madrasa (madrasa_id, email),
  INDEX idx_madrasa (madrasa_id),
  INDEX idx_role (role_id),
  FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- ========================================================
-- STUDENTS
-- ========================================================

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,

  madrasa_id INT,
  division_id INT,
  class_id INT,
  previous_class_id INT,

  name_bn VARCHAR(200),
  name_ar VARCHAR(200),

  nid VARCHAR(50),
  gender ENUM('male','female'),

  dob DATE,
  age INT,

  father_name VARCHAR(200),
  father_name_ar VARCHAR(200),
  father_nid VARCHAR(50),
  father_occupation VARCHAR(150),

  mother_name VARCHAR(200),
  mother_nid VARCHAR(50),
  mother_occupation VARCHAR(150),

  guardian_phone VARCHAR(50),

  division VARCHAR(100),
  district VARCHAR(100),
  thana VARCHAR(100),
  village VARCHAR(150),

  image VARCHAR(255),

  roll INT,
  admission_date DATE,

  is_active TINYINT DEFAULT 1,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE,
  FOREIGN KEY (division_id) REFERENCES divisions(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (previous_class_id) REFERENCES classes(id)

) ENGINE=InnoDB;

-- ========================================================
-- TEACHERS (FINAL FIXED VERSION)
-- ========================================================
CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,

  madrasa_id INT NOT NULL,
  division_id INT NULL,

  name_bn VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200),

  nid VARCHAR(50),
  gender ENUM('male','female'),

  dob DATE,
  age INT,

  father_name VARCHAR(200),
  father_name_ar VARCHAR(200),
  father_nid VARCHAR(50),
  father_occupation VARCHAR(150),

  mother_name VARCHAR(200),
  mother_nid VARCHAR(50),
  mother_occupation VARCHAR(150),

  phone VARCHAR(50),
  email VARCHAR(150),

  designation VARCHAR(150),
  salary DECIMAL(10,2),

  image VARCHAR(255),
  joining_date DATE,

  is_active TINYINT DEFAULT 1,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- ✅ UNIQUE per madrasa
  UNIQUE KEY uniq_teacher_email (madrasa_id, email),

  -- ✅ indexes for performance
  INDEX idx_madrasa (madrasa_id),
  INDEX idx_division (division_id),

  FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE,
  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL

) ENGINE=InnoDB;

-- ========================================================
-- ACCOUNTS
-- ========================================================

CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  madrasa_id INT,
  type ENUM('income','expense'),
  amount DECIMAL(10,2),
  category VARCHAR(100),
  description VARCHAR(255),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- ACTIVITY LOGS
-- ========================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  madrasa_id INT,
  user_id INT,
  action VARCHAR(100),
  entity VARCHAR(100),
  entity_id INT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;