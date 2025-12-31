const pool = require('../config/database');

class Vitals {
    /**
     * Save new vital signs reading
     * @param {Object} vitalData - { patientId, heartRate, spo2, bodyTemperature, roomTemperature, humidity }
     */
    static async saveVitals(vitalData) {
        const { 
            patientId, 
            heartRate, 
            heartRateStatus,
            spo2, 
            spo2Status,
            bodyTemperature, 
            bodyTemperatureStatus,
            roomTemperature, 
            roomTemperatureStatus,
            humidity,
            humidityStatus
        } = vitalData;

        const query = `
            INSERT INTO patient_vitals (
                patient_id, 
                heart_rate, 
                heart_rate_status,
                spo2, 
                spo2_status,
                body_temperature, 
                body_temperature_status,
                room_temperature, 
                room_temperature_status,
                humidity,
                humidity_status,
                recorded_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const values = [
            patientId,
            heartRate,
            heartRateStatus,
            spo2,
            spo2Status,
            bodyTemperature,
            bodyTemperatureStatus,
            roomTemperature,
            roomTemperatureStatus,
            humidity,
            humidityStatus
        ];

        const [result] = await pool.execute(query, values);
        return result.insertId;
    }

    /**
     * Get vitals history for a patient
     * @param {number} patientId 
     * @param {Object} options - { limit, startDate, endDate }
     */
    static async getVitalsHistory(patientId, options = {}) {
        const { limit = 100, startDate, endDate } = options;
        
        let query = `
            SELECT 
                id,
                heart_rate,
                heart_rate_status,
                spo2,
                spo2_status,
                body_temperature,
                body_temperature_status,
                room_temperature,
                room_temperature_status,
                humidity,
                humidity_status,
                recorded_at
            FROM patient_vitals
            WHERE patient_id = ?
        `;
        
        const values = [patientId];
        
        if (startDate) {
            query += ` AND recorded_at >= ?`;
            values.push(startDate);
        }
        
        if (endDate) {
            query += ` AND recorded_at <= ?`;
            values.push(endDate);
        }
        
        query += ` ORDER BY recorded_at DESC LIMIT ?`;
        values.push(limit);

        const [rows] = await pool.execute(query, values);
        return rows;
    }

    /**
     * Get latest vital reading for a patient
     * @param {number} patientId 
     */
    static async getLatestVitals(patientId) {
        const query = `
            SELECT 
                id,
                heart_rate,
                heart_rate_status,
                spo2,
                spo2_status,
                body_temperature,
                body_temperature_status,
                room_temperature,
                room_temperature_status,
                humidity,
                humidity_status,
                recorded_at
            FROM patient_vitals
            WHERE patient_id = ?
            ORDER BY recorded_at DESC
            LIMIT 1
        `;

        const [rows] = await pool.execute(query, [patientId]);
        return rows[0] || null;
    }

    /**
     * Get vitals statistics for a patient
     * @param {number} patientId 
     * @param {Object} options - { days: number of days to look back }
     */
    static async getVitalsStats(patientId, options = {}) {
        const { days = 7 } = options;
        
        const query = `
            SELECT 
                AVG(heart_rate) as avg_heart_rate,
                MIN(heart_rate) as min_heart_rate,
                MAX(heart_rate) as max_heart_rate,
                AVG(spo2) as avg_spo2,
                MIN(spo2) as min_spo2,
                MAX(spo2) as max_spo2,
                AVG(body_temperature) as avg_body_temperature,
                MIN(body_temperature) as min_body_temperature,
                MAX(body_temperature) as max_body_temperature,
                AVG(room_temperature) as avg_room_temperature,
                AVG(humidity) as avg_humidity,
                COUNT(*) as total_readings,
                SUM(CASE WHEN heart_rate_status = 'critical' OR spo2_status = 'critical' OR body_temperature_status = 'critical' THEN 1 ELSE 0 END) as critical_readings
            FROM patient_vitals
            WHERE patient_id = ?
            AND recorded_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `;

        const [rows] = await pool.execute(query, [patientId, days]);
        return rows[0] || null;
    }

    /**
     * Delete old vitals data (cleanup)
     * @param {number} daysToKeep 
     */
    static async deleteOldVitals(daysToKeep = 90) {
        const query = `
            DELETE FROM patient_vitals
            WHERE recorded_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        `;

        const [result] = await pool.execute(query, [daysToKeep]);
        return result.affectedRows;
    }
}

module.exports = Vitals;
