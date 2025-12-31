-- Create patient_vitals table for storing vital signs history
CREATE TABLE IF NOT EXISTS patient_vitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    
    -- Vital signs with their status
    heart_rate INT NOT NULL,
    heart_rate_status ENUM('normal', 'warning', 'critical') DEFAULT 'normal',
    
    spo2 DECIMAL(4,1) NOT NULL,
    spo2_status ENUM('normal', 'warning', 'critical') DEFAULT 'normal',
    
    body_temperature DECIMAL(4,1) NOT NULL,
    body_temperature_status ENUM('normal', 'warning', 'critical') DEFAULT 'normal',
    
    room_temperature DECIMAL(4,1) NOT NULL,
    room_temperature_status ENUM('normal', 'warning', 'critical') DEFAULT 'normal',
    
    humidity INT NOT NULL,
    humidity_status ENUM('normal', 'warning', 'critical') DEFAULT 'normal',
    
    -- Timestamp
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for faster queries
    INDEX idx_patient_id (patient_id),
    INDEX idx_recorded_at (recorded_at),
    INDEX idx_patient_time (patient_id, recorded_at),
    
    -- Foreign key constraint (if users table exists)
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for critical vitals queries
CREATE INDEX idx_critical_status ON patient_vitals (
    patient_id,
    heart_rate_status,
    spo2_status,
    body_temperature_status
);
