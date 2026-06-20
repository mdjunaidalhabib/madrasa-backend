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
  website_status ENUM('active','limited','disabled') NOT NULL DEFAULT 'active',
  custom_domain VARCHAR(190) NULL,
  plan_status ENUM('trial','active','expired','suspended') NOT NULL DEFAULT 'active',
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
(2,'Nazera','নাযেরা'),
(2,'Hifz','হিফজ'),

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

-- class play
(1,'bangla book','বাংলা শিশু'),
(1,'english book','ইংরেজি শিশু'),
(1,'gonit book','গণিত শিশু'),

-- class one
(2,'bangla book','বাংলা প্রথম'),
(2,'english book','ইংরেজি প্রথম'),
(2,'gonit book','গণিত প্রথম'),


-- class two
(3,'bangla book','বাংলা ২য়'),
(3,'english book','ইংরেজি ২য়'),
(3,'gonit book','গণিত ২য়'),

-- class three
(4,'bangla book','বাংলা ৩য়'),
(4,'english book','ইংরেজি ৩য়'),
(4,'gonit book','গণিত ৩য়'),

-- nazera
(5,'Nazera','নাযেরা'),
(5,'tazbid','তাজবিদ'),
(5,'masala','মাসআলা'),

-- hifs 
(6,'Hifz','হিফজ'),
(6,'tazbid','তাজবিদ'),
(6,'masala','মাসআলা'),


(7,'Urdu Kayeda','উর্দু কায়েদা'),


-- taisir
(8,'Urdu kayeda','উর্দু কায়েদা'),
(8,'Urdu tesri','উর্দু তেসরি'),
(8,'english','ইংরেজি'),
(8,'bangla','বাংলা'),
(8,'gonit','গণিত'),
(8,'english','ইংরেজি'),
(8,'etihas','ইতিহাস'),
(8,'vugol','ভূগোল'),



-- Mizan
(9,'Mizan','মিজান'),
(9,'esho arbi sikhi','এশো আরবি শিক্ষা'),
(9,'bakuratul adob','বাকুরাতুল আদব'),
(9,'behesti jeor','বেহেস্তি জেওর'),
(9,'tarikhul islam','তারিখুল ইসলাম'),
(9,'english','ইংরেজি'),
(9,'bangla','বাংলা'),


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
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1
) ENGINE=InnoDB;

INSERT INTO modules (key_name,name,name_bn,group_name,sort_order) VALUES
('dashboard','Dashboard','ড্যাশবোর্ড','core',1),
('ihtemam','ihtemam','ইহতিমাম','core',2),
('reports','Reports','রিপোর্ট সমূহ','core',3),
('talimat','Talimat','তালিমাত','education',4),
('accounts','Accounts','হিসাব বিভাগ','core',5),
('students','Students','ছাত্র বিভাগ','core',6),
('admission','Admission','নতুন ভর্তি','core',7),
('settings','Settings','সেটিং','core',8),
('activity','Activity Log','অ্যাক্টিভিটি লগ','core',9),
('website','Website Settings','ওয়েবসাইট সেটিংস','core',10)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  name_bn = VALUES(name_bn),
  group_name = VALUES(group_name),
  sort_order = VALUES(sort_order);

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


-- Ihtimam
(2,'teacher_admission','Teacher Admission','নতুন শিক্ষক',1),
(2,'teachers','Teachers','শিক্ষকসমূহ',2),

-- reports
(3,'academic_report','Academic Report','একাডেমিক রিপোর্ট',1),
(3,'student_report','Student Report','ছাত্র রিপোর্ট',2),
(3,'teacher_report','Teacher Report','শিক্ষক রিপোর্ট',3),

-- Talimat
(4,'class_panel','Class Panel','ক্লাস প্যানেল',1),
(4,'teacher_assignment','Teacher Assignment','কিতাব বন্টন',2), 
(4,'exam_panel','Exam Panel','পরিক্ষা প্যানেল',3), 
(4,'results','Results','রেজাল্ট',4),
(4,'id_card','ID Card','আইডি কার্ড',5),
(4,'admit_card','Admit Card','প্রবেশ পত্র',6),
(4,'certificate','Certificate','সনদ / সার্টিফিকেট',7),
(4,'testimonial','Testimonial','প্রত্যয়ন পত্র',8),
(4,'transfer_letter','Transfer Letter','ছাড় পত্র',9),
(4,'bulk_marks','Bulk Marks Import','Bulk নম্বর আপলোড',10),

-- Accounts
(5,'income','Income','আয়/রশিদ জমা',1),
(5,'expense','Expense','ব্যয়/ভাউচার তৈরী',2),
(5,'report','Report','আয় ব্যয় রিপোর্ট',3),
(5,'fees','Student Fees','ছাত্র বেতন ট্র্যাকিং',4),
(5,'salaries','Teacher Salaries','শিক্ষক বেতন / পেরোল',5),

-- students
(6,'new_admission','New Admission','নতুন ভর্তি',1),
(6,'list','list','ছাত্রসমূহ',2)
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

  madrasa_id INT NOT NULL,

  division_id INT NOT NULL,
  class_id INT NOT NULL,
  previous_class_id INT NULL,

  name_bn VARCHAR(200) NOT NULL,
  arabic_name VARCHAR(200) NULL,

  nid VARCHAR(50) NULL,

  -- 1 = Male, 2 = Female
  gender TINYINT(1) NULL,

  dob DATE NULL,
  age INT NULL,

  father_name VARCHAR(200) NULL,
  father_arabic_name VARCHAR(200) NULL,
  father_nid VARCHAR(50) NULL,
  father_occupation VARCHAR(150) NULL,

  mother_name VARCHAR(200) NULL,
  mother_nid VARCHAR(50) NULL,
  mother_occupation VARCHAR(150) NULL,

  guardian_phone VARCHAR(20) NULL,

  division VARCHAR(100) NULL,
  district VARCHAR(100) NULL,
  thana VARCHAR(100) NULL,
  village VARCHAR(150) NULL,

  image LONGTEXT NULL,

  roll INT NULL,

  admission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT(1) NOT NULL DEFAULT 1,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_madrasa (madrasa_id),
  INDEX idx_class (class_id),
  INDEX idx_phone (guardian_phone),
  INDEX idx_gender (gender),

  UNIQUE KEY unique_roll_per_madrasa (madrasa_id, roll),

  CONSTRAINT fk_students_madrasa
    FOREIGN KEY (madrasa_id) REFERENCES madrasas(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_students_division
    FOREIGN KEY (division_id) REFERENCES divisions(id)
    ON DELETE RESTRICT,

  CONSTRAINT fk_students_class
    FOREIGN KEY (class_id) REFERENCES classes(id)
    ON DELETE RESTRICT,

  CONSTRAINT fk_students_previous_class
    FOREIGN KEY (previous_class_id) REFERENCES classes(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;


-- ========================================================
-- TEACHERS (FINAL FIXED VERSION)
-- ========================================================
CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,

  madrasa_id INT NOT NULL,
  division_id INT NOT NULL,

  name_bn VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200),

  nid VARCHAR(50),
  gender TINYINT NULL COMMENT '1=male, 2=female',

  dob DATE,
  age INT,

  phone VARCHAR(50) NULL,
  email VARCHAR(150),

  designation VARCHAR(150),
  department VARCHAR(150),
  qualification VARCHAR(200),

  experience_year INT DEFAULT 0,
  experience_month INT DEFAULT 0,

  experience_total_months INT GENERATED ALWAYS AS (
    (IFNULL(experience_year,0) * 12) + IFNULL(experience_month,0)
  ) STORED,

  joining_date DATE,
  salary DECIMAL(10,2),

  father_name VARCHAR(200),
  father_name_ar VARCHAR(200),
  father_nid VARCHAR(50),
  father_occupation VARCHAR(150),

  mother_name VARCHAR(200),
  mother_nid VARCHAR(50),
  mother_occupation VARCHAR(150),

  parent_phone VARCHAR(50),

  division VARCHAR(100),
  district VARCHAR(100),
  thana VARCHAR(100),
  village VARCHAR(150),

  image TEXT,

  is_active TINYINT DEFAULT 1,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_teacher_email (madrasa_id, email),

  INDEX idx_madrasa (madrasa_id),
  INDEX idx_division_id (division_id),
  INDEX idx_phone (phone),
  INDEX idx_experience_total (experience_total_months),
  INDEX idx_joining_date (joining_date),

  FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE,
  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS teacher_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,

  teacher_id INT NOT NULL,
  class_id INT NOT NULL,
  book_id INT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_assignment (teacher_id, class_id, book_id),

  INDEX idx_teacher (teacher_id),
  INDEX idx_class (class_id),
  INDEX idx_book (book_id)
);

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
  receipt_no VARCHAR(80) NULL,
  voucher_no VARCHAR(80) NULL,
  fund VARCHAR(120) NULL,
  donor_name VARCHAR(200) NULL,
  receiver_name VARCHAR(200) NULL,
  address VARCHAR(255) NULL,
  mobile VARCHAR(30) NULL,
  payment_method VARCHAR(80) NULL,
  entry_date DATE NULL,
  entry_time TIME NULL,
  created_by INT,
  deleted_at TIMESTAMP NULL,
  hard_deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_accounts_madrasa_type (madrasa_id, type),
  INDEX idx_accounts_fund (fund),
  INDEX idx_accounts_entry_date (entry_date),
  FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE
) ENGINE=InnoDB;


/* =========================
   EXAMS TABLE
========================= */
CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  year VARCHAR(20) NOT NULL,

  school_id INT NOT NULL DEFAULT 1,
  created_by INT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_exam_school (school_id, name, year)
);

/* =========================
   EXAMS DEMO DATA
========================= */
INSERT INTO exams (name, year) VALUES
('১ম সাময়িক পরিক্ষা', '2026'),
('২য় সাময়িক পরিক্ষা', '2026'),
('বার্ষিক পরীক্ষা', '2026'),
('মাসিক পরীক্ষা', '2026'),
('টেস্ট পরীক্ষা', '2026')
ON DUPLICATE KEY UPDATE name=name;


/* =========================
   GENERAL GRADES TABLE
========================= */
CREATE TABLE IF NOT EXISTS general_grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(10) NOT NULL,
  min_mark INT NOT NULL,
  max_mark INT NOT NULL,

  school_id INT NOT NULL DEFAULT 1,
  created_by INT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_general_grade_school (school_id, name)
);

/* =========================
   GENERAL GRADES DEMO DATA
========================= */
INSERT INTO general_grades (name, min_mark, max_mark) VALUES
('A+', 80, 100),
('A', 70, 79),
('A-', 60, 69),
('B', 50, 59),
('C', 40, 49),
('D', 33, 39),
('F', 0, 32)
ON DUPLICATE KEY UPDATE name=name;


/* =========================
   MADRASA GRADES TABLE
========================= */
CREATE TABLE IF NOT EXISTS madrasa_grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  min_mark INT NOT NULL,
  max_mark INT NOT NULL,

  school_id INT NOT NULL DEFAULT 1,
  created_by INT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_madrasa_grade_school (school_id, name)
);

/* =========================
   MADRASA GRADES DEMO DATA
========================= */
INSERT INTO madrasa_grades (name, min_mark, max_mark) VALUES
('মুমতাজ', 80, 100),
('জায়েদ জিদ্দান', 65, 79),
('জায়েদ', 50, 64),
('মাকবুল', 35, 49),
('রাসেব', 0, 34)
ON DUPLICATE KEY UPDATE name=name;


/* =========================
   SETTINGS TABLE
========================= */
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  value VARCHAR(50),

  school_id INT NOT NULL DEFAULT 1,
  created_by INT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO settings (name, value, school_id)
VALUES ('fail_mark', '35', 1)
ON DUPLICATE KEY UPDATE value=value;


/* =========================================================
   RESULTS MASTER
========================================================= */
CREATE TABLE IF NOT EXISTS results_master (
  id INT AUTO_INCREMENT PRIMARY KEY,

  school_id INT NOT NULL,
  exam_id INT NOT NULL,
  class_id INT NOT NULL,
  created_by INT NULL,

  status ENUM('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_session (school_id, exam_id, class_id),

  INDEX idx_school (school_id),
  INDEX idx_exam_class (exam_id, class_id),
  INDEX idx_school_exam_class (school_id, exam_id, class_id),
  INDEX idx_status (status)
);


/* =========================================================
   RESULTS SUMMARY
========================================================= */
CREATE TABLE IF NOT EXISTS results_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,

  result_master_id INT NOT NULL,
  student_id INT NOT NULL,

  total FLOAT NOT NULL DEFAULT 0,
  average FLOAT NOT NULL DEFAULT 0,

  general_grade VARCHAR(20) DEFAULT NULL,
  madrasa_grade VARCHAR(50) DEFAULT NULL,

  status VARCHAR(10) DEFAULT NULL,
  rank_no INT DEFAULT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_result (result_master_id, student_id),

  INDEX idx_result_master (result_master_id),
  INDEX idx_student (student_id),
  INDEX idx_rank (rank_no),
  INDEX idx_result_rank (result_master_id, rank_no)
);

/* =========================================================
   MARKS
========================================================= */
CREATE TABLE IF NOT EXISTS marks (
  id INT AUTO_INCREMENT PRIMARY KEY,

  result_master_id INT NOT NULL,
  student_id INT NOT NULL,
  exam_id INT NOT NULL,
  class_id INT NOT NULL,
  book_id INT NOT NULL,

  mark FLOAT NOT NULL DEFAULT 0,

  school_id INT NOT NULL DEFAULT 1,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_mark (
    result_master_id,
    student_id,
    class_id,
    book_id
  ),

  INDEX idx_master (result_master_id),
  INDEX idx_student (student_id),
  INDEX idx_exam (exam_id),
  INDEX idx_class (class_id),
  INDEX idx_book (book_id),
  INDEX idx_school (school_id),
  INDEX idx_master_student (result_master_id, student_id),
  INDEX idx_master_book (result_master_id, book_id),
  INDEX idx_school_exam_class (school_id, exam_id, class_id)

  /* Optional FK
  ,CONSTRAINT fk_marks_master
    FOREIGN KEY (result_master_id) REFERENCES results_master(id)
    ON DELETE CASCADE
  */
);

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



/* =========================================================
   WEBSITE / SAAS CONTROL UPDATES
   Safe for existing databases
========================================================= */

CREATE TABLE IF NOT EXISTS website_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  madrasa_id INT NOT NULL UNIQUE,
  logo_url VARCHAR(255) NULL,
  hero_title VARCHAR(190) NULL,
  hero_subtitle TEXT NULL,
  theme_color VARCHAR(30) DEFAULT '#2563eb',
  show_notices TINYINT DEFAULT 1,
  show_gallery TINYINT DEFAULT 1,
  show_teachers TINYINT DEFAULT 1,
  show_admission TINYINT DEFAULT 1,
  show_about TINYINT DEFAULT 1,
  show_contact TINYINT DEFAULT 1,
  is_published TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_website_settings_madrasa FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS website_pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  madrasa_id INT NOT NULL,
  page_key VARCHAR(60) NOT NULL,
  title VARCHAR(190) NOT NULL,
  content LONGTEXT NULL,
  is_published TINYINT DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_website_page (madrasa_id, page_key),
  CONSTRAINT fk_website_pages_madrasa FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS website_notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  madrasa_id INT NOT NULL,
  title VARCHAR(190) NOT NULL,
  content TEXT NULL,
  is_published TINYINT DEFAULT 1,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_website_notices_madrasa (madrasa_id, is_published, published_at),
  CONSTRAINT fk_website_notices_madrasa FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS website_gallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  madrasa_id INT NOT NULL,
  title VARCHAR(190) NULL,
  image_url VARCHAR(255) NOT NULL,
  is_published TINYINT DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_website_gallery_madrasa (madrasa_id, is_published, sort_order),
  CONSTRAINT fk_website_gallery_madrasa FOREIGN KEY (madrasa_id) REFERENCES madrasas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- Safe account upgrades for existing installations
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS receipt_no VARCHAR(80) NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS voucher_no VARCHAR(80) NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS fund VARCHAR(120) NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS donor_name VARCHAR(200) NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(200) NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS mobile VARCHAR(30) NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS payment_method VARCHAR(80) NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS entry_date DATE NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS hard_deleted_at TIMESTAMP NULL;
