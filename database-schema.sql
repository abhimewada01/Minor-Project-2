-- Smart Medical Management System Database Schema
-- MySQL Database Structure

-- Create Database
CREATE DATABASE IF NOT EXISTS medical_system;
USE medical_system;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    clinic_name VARCHAR(255),
    role ENUM('Administrator', 'Doctor', 'Nurse', 'User') NOT NULL DEFAULT 'User',
    avatar VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category ENUM('Pain Relief', 'Antibiotic', 'Vitamins', 'Gastric', 'Cardiovascular', 'Diabetes', 'Allergy', 'Other') NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 10,
    price_usd DECIMAL(10,2) NOT NULL,
    price_inr DECIMAL(10,2) NOT NULL DEFAULT 0,
    expiry_date DATE NOT NULL,
    supplier VARCHAR(255),
    status ENUM('Good', 'Critical') NOT NULL DEFAULT 'Good',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_stock CHECK (stock >= 0),
    CONSTRAINT chk_min_stock CHECK (min_stock > 0),
    CONSTRAINT chk_price_usd CHECK (price_usd >= 0),
    CONSTRAINT chk_price_inr CHECK (price_inr >= 0)
);

-- 3. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    age INT,
    gender ENUM('Male', 'Female', 'Other'),
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allergies TEXT,
    medical_history TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_age CHECK (age >= 0 AND age <= 150)
);

-- 4. Bills Table
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    patient_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    discount DECIMAL(5,2) NOT NULL DEFAULT 0,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method ENUM('Cash', 'Card', 'UPI', 'Insurance') NOT NULL DEFAULT 'Cash',
    status ENUM('Draft', 'Paid', 'Pending') NOT NULL DEFAULT 'Draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_total_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_discount CHECK (discount >= 0 AND discount <= 100)
);

-- 5. Bill Items Table
CREATE TABLE IF NOT EXISTS bill_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    medicine_id INT NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT,
    
    -- Constraints
    CONSTRAINT chk_quantity CHECK (quantity > 0),
    CONSTRAINT chk_price CHECK (price >= 0),
    CONSTRAINT chk_total CHECK (total >= 0)
);

-- 6. User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    prescription_date DATE NOT NULL,
    notes TEXT,
    status ENUM('Active', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- 8. Prescription Medicines Table
CREATE TABLE IF NOT EXISTS prescription_medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    medicine_id INT NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT
);

-- Indexes for better performance
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_category ON medicines(category);
CREATE INDEX idx_medicines_expiry ON medicines(expiry_date);
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_bills_patient_id ON bills(patient_id);
CREATE INDEX idx_bills_created_at ON bills(created_at);
CREATE INDEX idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON prescriptions(doctor_id);

-- Sample Data for Testing
INSERT INTO medicines (name, category, stock, min_stock, price_usd, price_inr, expiry_date, supplier) VALUES
('Paracetamol 500mg', 'Pain Relief', 100, 20, 2.50, 207.50, '2024-12-31', 'Pharma Corp'),
('Amoxicillin 250mg', 'Antibiotic', 50, 15, 5.00, 415.00, '2024-11-30', 'MediSupply'),
('Ibuprofen 400mg', 'Pain Relief', 75, 25, 3.50, 290.50, '2024-10-15', 'HealthPlus'),
('Vitamin D3 1000IU', 'Vitamins', 200, 50, 8.00, 664.00, '2025-01-15', 'NutriLife'),
('Omeprazole 20mg', 'Gastric', 30, 10, 4.50, 373.50, '2024-09-20', 'GastroCare'),
('Aspirin 75mg', 'Pain Relief', 150, 30, 1.50, 124.50, '2024-08-10', 'PharmaCorp'),
('Metformin 500mg', 'Diabetes', 80, 20, 6.00, 498.00, '2024-07-25', 'DiabetesCare'),
('Cetirizine 10mg', 'Allergy', 60, 15, 2.00, 166.00, '2024-06-30', 'AllergyRelief');

INSERT INTO users (name, email, password_hash, phone, role) VALUES
('Admin User', 'admin@medical.com', 'hashed_password_here', '+91-9876543210', 'Administrator'),
('Dr. Smith', 'dr.smith@medical.com', 'hashed_password_here', '+91-9123456789', 'Doctor'),
('Nurse Johnson', 'nurse.johnson@medical.com', 'hashed_password_here', '+91-8765432109', 'Nurse');

INSERT INTO patients (name, email, phone, age, gender, blood_group) VALUES
('John Doe', 'john.doe@email.com', '+91-9876543210', 35, 'Male', 'O+'),
('Jane Smith', 'jane.smith@email.com', '+91-9123456789', 28, 'Female', 'A+'),
('Robert Johnson', 'robert.j@email.com', '+91-8765432109', 45, 'Male', 'B+');
