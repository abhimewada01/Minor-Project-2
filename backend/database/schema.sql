-- Smart Medical System Database Schema
-- MySQL Database Creation Script

-- Create Database
CREATE DATABASE IF NOT EXISTS medical_system;
USE medical_system;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  clinic_name VARCHAR(255),
  role ENUM('Administrator', 'Doctor', 'Nurse', 'User') DEFAULT 'User',
  avatar VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_active (is_active),
  INDEX idx_role (role)
);

-- USER SESSIONS
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_expires (expires_at),
  INDEX idx_user_id (user_id)
);

-- MEDICINES
CREATE TABLE IF NOT EXISTS medicines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 10,
  price_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  price_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  expiry_date DATE NOT NULL,
  supplier VARCHAR(255),
  status ENUM('Good', 'Critical') DEFAULT 'Good',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_category (category),
  INDEX idx_supplier (supplier),
  INDEX idx_status (status),
  INDEX idx_stock (stock),
  INDEX idx_expiry (expiry_date),
  INDEX idx_created (created_at)
);

-- PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  age INT,
  gender ENUM('Male','Female','Other'),
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'),
  allergies TEXT,
  medical_history TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_patients_name (name),
  INDEX idx_patients_phone (phone)
);

-- BILLS
CREATE TABLE IF NOT EXISTS bills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bill_number VARCHAR(50) NOT NULL UNIQUE,
  patient_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method ENUM('Cash','Card','UPI','Insurance') NOT NULL DEFAULT 'Cash',
  status ENUM('Draft','Paid','Pending','Sent') NOT NULL DEFAULT 'Draft',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_bills_patient_id (patient_id),
  INDEX idx_bills_created_at (created_at)
);

-- BILL ITEMS
CREATE TABLE IF NOT EXISTS bill_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bill_id INT NOT NULL,
  medicine_id INT NOT NULL,
  medicine_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT,
  INDEX idx_bill_items_bill_id (bill_id),
  INDEX idx_bill_items_medicine_id (medicine_id)
);

-- optional: payments table (if later needed)
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bill_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('Cash','Card','UPI','Insurance') NOT NULL,
  status ENUM('Pending','Completed','Failed') NOT NULL DEFAULT 'Completed',
  transaction_ref VARCHAR(255),
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
  INDEX idx_payments_bill_id (bill_id)
);

-- --------------------
-- SAMPLE SEED DATA
-- --------------------

-- NOTE: keep password_hash as-is; update to real hashes if you want logins to work.
INSERT INTO users (name, email, password_hash, phone, address, clinic_name, role) VALUES
('Dr. Sarah Johnson', 'sarah.johnson@medicareclinic.com', '$2a$10$0000000000000000000000', '+91 9876543210', '123 Medical Center, Delhi, India 110001', 'MediCare Central Clinic', 'Administrator'),
('Dr. Rajesh Kumar', 'rajesh.kumar@medicareclinic.com', '$2a$10$0000000000000000000000', '+91 8765432109', '456 Hospital Road, Mumbai, India 400001', 'City Health Clinic', 'Doctor'),
('Dr. Priya Sharma', 'priya.sharma@medicareclinic.com', '$2a$10$0000000000000000000000', '+91 7654321098', '789 Nursing Home, Bangalore, India 560001', 'Care Medical Center', 'Nurse');

-- Medicines
INSERT INTO medicines (name, category, stock, min_stock, price_usd, price_inr, expiry_date, supplier) VALUES
('Paracetamol 500mg', 'Pain Relief', 45, 100, 2.50, 207.50, '2026-12-31', 'PharmaCorp'),
('Amoxicillin 250mg', 'Antibiotic', 20, 50, 5.00, 415.00, '2026-10-15', 'MediSupply'),
('Ibuprofen 400mg', 'Pain Relief', 30, 80, 3.50, 290.50, '2027-03-20', 'PharmaCorp'),
('Vitamin D3 1000IU', 'Vitamins', 150, 60, 8.00, 664.00, '2027-06-30', 'HealthPlus'),
('Omeprazole 20mg', 'Gastric', 85, 70, 4.50, 373.50, '2026-09-10', 'MediSupply'),
('Aspirin 75mg', 'Cardiovascular', 120, 90, 1.50, 124.50, '2027-01-15', 'PharmaCorp'),
('Metformin 500mg', 'Diabetes', 15, 60, 6.00, 498.00, '2026-11-20', 'DiabetesCare'),
('Cetirizine 10mg', 'Allergy', 95, 70, 2.00, 166.00, '2027-04-25', 'HealthPlus');

-- Patients
INSERT INTO patients (name, email, phone, address, age, gender, blood_group) VALUES
('John Doe', 'john.doe@email.com', '+91 9876543210', '221B Baker Street, Delhi', 35, 'Male', 'O+'),
('Sarah Wilson', 'sarah.wilson@email.com', '+91 8765432109', '12 Marina Road, Mumbai', 28, 'Female', 'A+'),
('Robert Johnson', 'robert.j@email.com', '+91 7654321098', '77 Lake View, Bangalore', 45, 'Male', 'B+');

-- Bills (create some so frontend history works)
-- IDs for patients/medicines rely on auto_increment ordering; this seed assumes a fresh DB.
INSERT INTO bills (bill_number, patient_id, total_amount, discount, tax, payment_method, status, notes, created_at) VALUES
('INV-123456', 1, 2499.50, 0, 0, 'Cash', 'Sent', 'Seed bill 1', '2026-05-01 10:00:00'),
('INV-123457', 2, 1899.00, 0, 0, 'Card', 'Sent', 'Seed bill 2', '2026-05-02 11:00:00'),
('INV-123458', 3, 1520.00, 10, 0, 'UPI', 'Paid', 'Seed bill 3', '2026-05-03 09:30:00');

-- Bill Items
-- bill 1 items
INSERT INTO bill_items (bill_id, medicine_id, medicine_name, quantity, price, total, created_at) VALUES
(1, 1, 'Paracetamol 500mg', 5, 2.50, 12.50, '2026-05-01 10:00:10'),
(1, 5, 'Omeprazole 20mg', 10, 373.50, 3735.00, '2026-05-01 10:00:20');

-- bill 2 items
INSERT INTO bill_items (bill_id, medicine_id, medicine_name, quantity, price, total, created_at) VALUES
(2, 2, 'Amoxicillin 250mg', 2, 415.00, 830.00, '2026-05-02 11:00:10'),
(2, 3, 'Ibuprofen 400mg', 3, 290.50, 871.50, '2026-05-02 11:00:20');

-- bill 3 items
INSERT INTO bill_items (bill_id, medicine_id, medicine_name, quantity, price, total, created_at) VALUES
(3, 4, 'Vitamin D3 1000IU', 1, 664.00, 664.00, '2026-05-03 09:30:10'),
(3, 6, 'Aspirin 75mg', 1, 124.50, 124.50, '2026-05-03 09:30:20');

-- Payments (optional)
INSERT INTO payments (bill_id, amount, payment_method, status, transaction_ref, paid_at) VALUES
(1, 2499.50, 'Cash', 'Completed', 'SEED-CASH-001', '2026-05-01 10:05:00'),
(2, 1899.00, 'Card', 'Completed', 'SEED-CARD-002', '2026-05-02 11:05:00');

