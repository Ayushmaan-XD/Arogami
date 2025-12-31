const express = require('express');
const router = express.Router();
const Vitals = require('../models/vitals');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// Middleware to verify JWT token and extract patient ID
const verifyPatientToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.body.token;
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.patientId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        logger.error('Token verification failed:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware to verify doctor or patient access
const verifyAccess = (req, res, next) => {
    if (req.userRole !== 'patient' && req.userRole !== 'doctor') {
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
};

/**
 * POST /api/vitals
 * Save new vital signs reading
 * Body: { heartRate, spo2, bodyTemperature, roomTemperature, humidity, statuses }
 */
router.post('/', verifyPatientToken, async (req, res) => {
    try {
        if (req.userRole !== 'patient') {
            return res.status(403).json({ error: 'Only patients can record vitals' });
        }

        const {
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
        } = req.body;

        // Validate required fields
        if (!heartRate || !spo2 || !bodyTemperature || !roomTemperature || !humidity) {
            return res.status(400).json({ error: 'All vital signs are required' });
        }

        const vitalData = {
            patientId: req.patientId,
            heartRate,
            heartRateStatus: heartRateStatus || 'normal',
            spo2,
            spo2Status: spo2Status || 'normal',
            bodyTemperature,
            bodyTemperatureStatus: bodyTemperatureStatus || 'normal',
            roomTemperature,
            roomTemperatureStatus: roomTemperatureStatus || 'normal',
            humidity,
            humidityStatus: humidityStatus || 'normal'
        };

        const vitalId = await Vitals.saveVitals(vitalData);
        
        logger.info(`Vitals saved for patient ${req.patientId}, ID: ${vitalId}`);
        
        res.status(201).json({
            success: true,
            vitalId,
            message: 'Vitals recorded successfully'
        });

    } catch (error) {
        logger.error('Error saving vitals:', error);
        res.status(500).json({ error: 'Failed to save vitals' });
    }
});

/**
 * GET /api/vitals/history
 * Get vitals history for the logged-in patient
 * Query params: limit, startDate, endDate
 */
router.get('/history', verifyPatientToken, verifyAccess, async (req, res) => {
    try {
        const patientId = req.userRole === 'patient' ? req.patientId : req.query.patientId;
        
        if (!patientId) {
            return res.status(400).json({ error: 'Patient ID is required' });
        }

        const options = {
            limit: parseInt(req.query.limit) || 100,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        const history = await Vitals.getVitalsHistory(patientId, options);
        
        res.json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (error) {
        logger.error('Error fetching vitals history:', error);
        res.status(500).json({ error: 'Failed to fetch vitals history' });
    }
});

/**
 * GET /api/vitals/latest
 * Get latest vital reading for the logged-in patient
 */
router.get('/latest', verifyPatientToken, verifyAccess, async (req, res) => {
    try {
        const patientId = req.userRole === 'patient' ? req.patientId : req.query.patientId;
        
        if (!patientId) {
            return res.status(400).json({ error: 'Patient ID is required' });
        }

        const latest = await Vitals.getLatestVitals(patientId);
        
        if (!latest) {
            return res.status(404).json({ error: 'No vitals found for this patient' });
        }

        res.json({
            success: true,
            data: latest
        });

    } catch (error) {
        logger.error('Error fetching latest vitals:', error);
        res.status(500).json({ error: 'Failed to fetch latest vitals' });
    }
});

/**
 * GET /api/vitals/stats
 * Get vitals statistics for the logged-in patient
 * Query params: days (default: 7)
 */
router.get('/stats', verifyPatientToken, verifyAccess, async (req, res) => {
    try {
        const patientId = req.userRole === 'patient' ? req.patientId : req.query.patientId;
        
        if (!patientId) {
            return res.status(400).json({ error: 'Patient ID is required' });
        }

        const days = parseInt(req.query.days) || 7;
        const stats = await Vitals.getVitalsStats(patientId, { days });
        
        if (!stats) {
            return res.status(404).json({ error: 'No vitals data found' });
        }

        res.json({
            success: true,
            data: stats,
            period: `${days} days`
        });

    } catch (error) {
        logger.error('Error fetching vitals stats:', error);
        res.status(500).json({ error: 'Failed to fetch vitals statistics' });
    }
});

/**
 * GET /api/vitals/patient/:patientId
 * Doctor endpoint to get patient vitals history
 */
router.get('/patient/:patientId', verifyPatientToken, async (req, res) => {
    try {
        if (req.userRole !== 'doctor') {
            return res.status(403).json({ error: 'Only doctors can access patient vitals' });
        }

        const patientId = req.params.patientId;
        
        const options = {
            limit: parseInt(req.query.limit) || 50,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        const history = await Vitals.getVitalsHistory(patientId, options);
        const stats = await Vitals.getVitalsStats(patientId, { days: 7 });
        
        res.json({
            success: true,
            patientId,
            count: history.length,
            history,
            stats
        });

    } catch (error) {
        logger.error('Error fetching patient vitals:', error);
        res.status(500).json({ error: 'Failed to fetch patient vitals' });
    }
});

module.exports = router;
