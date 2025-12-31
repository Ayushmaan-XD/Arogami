const pool = require('../config/database');
const logger = require('../config/logger');

async function createVitalsTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS patient_vitals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            
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
            
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            INDEX idx_patient_id (patient_id),
            INDEX idx_recorded_at (recorded_at),
            INDEX idx_patient_time (patient_id, recorded_at),
            INDEX idx_critical_status (patient_id, heart_rate_status, spo2_status, body_temperature_status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    try {
        await pool.execute(createTableQuery);
        logger.info('✅ patient_vitals table created successfully');
        console.log('✅ patient_vitals table created successfully');
        
        // Check if table was created
        const [tables] = await pool.execute("SHOW TABLES LIKE 'patient_vitals'");
        if (tables.length > 0) {
            console.log('✅ Table verification passed');
            
            // Show table structure
            const [columns] = await pool.execute('DESCRIBE patient_vitals');
            console.log('\n📋 Table structure:');
            console.table(columns);
        }
        
        process.exit(0);
    } catch (error) {
        logger.error('❌ Error creating patient_vitals table:', error);
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    createVitalsTable();
}

module.exports = createVitalsTable;
