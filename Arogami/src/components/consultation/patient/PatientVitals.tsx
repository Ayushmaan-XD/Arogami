import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Navbar/NavBar';
import Copyright from '../Copyright/Copyright';
import VitalsChart from '../Doctor/VitalsChart';
import { BACKEND_URL } from '../services/api';
import './PatientVitals.css';

interface VitalReading {
    value: number;
    timestamp: Date;
    status: 'normal' | 'warning' | 'critical';
}

interface Vitals {
    heartRate: VitalReading;
    spo2: VitalReading;
    bodyTemperature: VitalReading;
    roomTemperature: VitalReading;
    humidity: VitalReading;
}

interface VitalHistory {
    id: number;
    heart_rate: number;
    heart_rate_status: string;
    spo2: number;
    spo2_status: string;
    body_temperature: number;
    body_temperature_status: string;
    room_temperature: number;
    room_temperature_status: string;
    humidity: number;
    humidity_status: string;
    recorded_at: string;
}

function PatientVitals() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    const [vitals, setVitals] = useState<Vitals>({
        heartRate: { value: 0, timestamp: new Date(), status: 'normal' },
        spo2: { value: 0, timestamp: new Date(), status: 'normal' },
        bodyTemperature: { value: 0, timestamp: new Date(), status: 'normal' },
        roomTemperature: { value: 0, timestamp: new Date(), status: 'normal' },
        humidity: { value: 0, timestamp: new Date(), status: 'normal' }
    });
    const [history, setHistory] = useState<VitalHistory[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Simulate IoT sensor connection and data streaming
    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/consultation/patient');
                return;
            }

            try {
                const response = await axios.post(`${BACKEND_URL}/api/auth/verify`, { token });
                if (response.data.role !== 'patient') {
                    navigate('/consultation');
                    return;
                }
            } catch (error) {
                console.error('Auth verification failed:', error);
                navigate('/consultation/patient');
                return;
            }

            setIsLoading(false);
            connectToSensors();
        };

        verifyAuth();
    }, [navigate]);

    const connectToSensors = () => {
        setIsConnected(true);
        
        // Simulate real-time sensor data updates
        const interval = setInterval(() => {
            updateVitals();
        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    };

    const updateVitals = async () => {
        const now = new Date();

        // Simulate realistic vital signs with slight variations
        const heartRate = 60 + Math.random() * 40; // 60-100 bpm
        const spo2 = 95 + Math.random() * 5; // 95-100%
        const bodyTemp = 36.5 + Math.random() * 1; // 36.5-37.5°C
        const roomTemp = 20 + Math.random() * 8; // 20-28°C
        const humidity = 40 + Math.random() * 30; // 40-70%

        const newVitals = {
            heartRate: {
                value: Math.round(heartRate),
                timestamp: now,
                status: getHeartRateStatus(heartRate)
            },
            spo2: {
                value: Math.round(spo2 * 10) / 10,
                timestamp: now,
                status: getSpo2Status(spo2)
            },
            bodyTemperature: {
                value: Math.round(bodyTemp * 10) / 10,
                timestamp: now,
                status: getBodyTemperatureStatus(bodyTemp)
            },
            roomTemperature: {
                value: Math.round(roomTemp * 10) / 10,
                timestamp: now,
                status: getRoomTemperatureStatus(roomTemp)
            },
            humidity: {
                value: Math.round(humidity),
                timestamp: now,
                status: getHumidityStatus(humidity)
            }
        };

        setVitals(newVitals);

        // Save vitals to backend
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${BACKEND_URL}/api/vitals`, {
                heartRate: newVitals.heartRate.value,
                heartRateStatus: newVitals.heartRate.status,
                spo2: newVitals.spo2.value,
                spo2Status: newVitals.spo2.status,
                bodyTemperature: newVitals.bodyTemperature.value,
                bodyTemperatureStatus: newVitals.bodyTemperature.status,
                roomTemperature: newVitals.roomTemperature.value,
                roomTemperatureStatus: newVitals.roomTemperature.status,
                humidity: newVitals.humidity.value,
                humidityStatus: newVitals.humidity.status
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Failed to save vitals:', error);
            // Don't block UI if save fails
        }
    };

    // Status determination functions
    const getHeartRateStatus = (hr: number): 'normal' | 'warning' | 'critical' => {
        if (hr < 50 || hr > 110) return 'critical';
        if (hr < 60 || hr > 100) return 'warning';
        return 'normal';
    };

    const getSpo2Status = (spo2: number): 'normal' | 'warning' | 'critical' => {
        if (spo2 < 90) return 'critical';
        if (spo2 < 95) return 'warning';
        return 'normal';
    };

    const getBodyTemperatureStatus = (temp: number): 'normal' | 'warning' | 'critical' => {
        if (temp < 35 || temp > 38.5) return 'critical';
        if (temp < 36 || temp > 37.5) return 'warning';
        return 'normal';
    };

    const getRoomTemperatureStatus = (temp: number): 'normal' | 'warning' | 'critical' => {
        if (temp < 18 || temp > 30) return 'critical';
        if (temp < 20 || temp > 26) return 'warning';
        return 'normal';
    };

    const getHumidityStatus = (humidity: number): 'normal' | 'warning' | 'critical' => {
        if (humidity < 30 || humidity > 70) return 'critical';
        if (humidity < 40 || humidity > 60) return 'warning';
        return 'normal';
    };

    const formatTime = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleTimeString();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'normal': return '✅';
            case 'warning': return '⚠️';
            case 'critical': return '🚨';
            default: return '⚪';
        }
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${BACKEND_URL}/api/vitals/history?limit=50`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setHistory(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch vitals history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleTabChange = (tab: 'current' | 'history') => {
        setActiveTab(tab);
        if (tab === 'history' && history.length === 0) {
            fetchHistory();
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="vitals-wrapper">
            <Navbar isPatient={true} isLogout={true} isDoctor={false} />
            
            <div className="vitals-container">
                <div className="vitals-header">
                    <h1 className="vitals-title">Health Vitals Dashboard</h1>
                    <div className="header-actions">
                        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                            <span className="status-dot"></span>
                            {isConnected ? 'Sensors Connected' : 'Connecting...'}
                        </div>
                        <button 
                            className="back-button"
                            onClick={() => navigate('/consultation/patient')}
                        >
                            ← Back to Portal
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="vitals-tabs">
                    <button 
                        className={`tab-button ${activeTab === 'current' ? 'active' : ''}`}
                        onClick={() => handleTabChange('current')}
                    >
                        📊 Current Vitals
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => handleTabChange('history')}
                    >
                        📈 History
                    </button>
                </div>

                {/* Current Vitals View */}
                {activeTab === 'current' && (
                    <>
                        <div className="vitals-grid">
                    {/* Heart Rate Card */}
                    <div className={`vital-card ${vitals.heartRate.status}`}>
                        <div className="vital-icon">❤️</div>
                        <div className="vital-content">
                            <div className="vital-label">Heart Rate</div>
                            <div className="vital-value">{vitals.heartRate.value} <span className="unit">bpm</span></div>
                            <div className="vital-status">
                                {getStatusIcon(vitals.heartRate.status)} {vitals.heartRate.status}
                            </div>
                            <div className="vital-time">{formatTime(vitals.heartRate.timestamp)}</div>
                        </div>
                    </div>

                    {/* SpO2 Card */}
                    <div className={`vital-card ${vitals.spo2.status}`}>
                        <div className="vital-icon">🌬️</div>
                        <div className="vital-content">
                            <div className="vital-label">SpO2 (Oxygen)</div>
                            <div className="vital-value">{vitals.spo2.value} <span className="unit">%</span></div>
                            <div className="vital-status">
                                {getStatusIcon(vitals.spo2.status)} {vitals.spo2.status}
                            </div>
                            <div className="vital-time">{formatTime(vitals.spo2.timestamp)}</div>
                        </div>
                    </div>

                    {/* Body Temperature Card */}
                    <div className={`vital-card ${vitals.bodyTemperature.status}`}>
                        <div className="vital-icon">🌡️</div>
                        <div className="vital-content">
                            <div className="vital-label">Body Temperature</div>
                            <div className="vital-value">{vitals.bodyTemperature.value} <span className="unit">°C</span></div>
                            <div className="vital-status">
                                {getStatusIcon(vitals.bodyTemperature.status)} {vitals.bodyTemperature.status}
                            </div>
                            <div className="vital-time">{formatTime(vitals.bodyTemperature.timestamp)}</div>
                        </div>
                    </div>

                    {/* Room Temperature Card */}
                    <div className={`vital-card ${vitals.roomTemperature.status}`}>
                        <div className="vital-icon">🏠</div>
                        <div className="vital-content">
                            <div className="vital-label">Room Temperature</div>
                            <div className="vital-value">{vitals.roomTemperature.value} <span className="unit">°C</span></div>
                            <div className="vital-status">
                                {getStatusIcon(vitals.roomTemperature.status)} {vitals.roomTemperature.status}
                            </div>
                            <div className="vital-time">{formatTime(vitals.roomTemperature.timestamp)}</div>
                        </div>
                    </div>

                    {/* Humidity Card */}
                    <div className={`vital-card ${vitals.humidity.status}`}>
                        <div className="vital-icon">💧</div>
                        <div className="vital-content">
                            <div className="vital-label">Humidity</div>
                            <div className="vital-value">{vitals.humidity.value} <span className="unit">%</span></div>
                            <div className="vital-status">
                                {getStatusIcon(vitals.humidity.status)} {vitals.humidity.status}
                            </div>
                            <div className="vital-time">{formatTime(vitals.humidity.timestamp)}</div>
                        </div>
                    </div>
                </div>

                {/* Alert Banner */}
                {(vitals.heartRate.status === 'critical' || 
                  vitals.spo2.status === 'critical' || 
                  vitals.bodyTemperature.status === 'critical' ||
                  vitals.roomTemperature.status === 'critical' ||
                  vitals.humidity.status === 'critical') && (
                    <div className="alert-banner critical">
                        🚨 Critical vital signs detected! Please consult your doctor immediately.
                    </div>
                )}

                        {/* Info Section */}
                        <div className="info-section">
                            <h2>📊 About Your Vitals</h2>
                            <div className="info-grid">
                                <div className="info-card">
                                    <h3>Normal Ranges</h3>
                                    <ul>
                                        <li>Heart Rate: 60-100 bpm</li>
                                        <li>SpO2 (Oxygen): 95-100%</li>
                                        <li>Body Temperature: 36.0-37.5°C</li>
                                        <li>Room Temperature: 20-26°C</li>
                                        <li>Humidity: 40-60%</li>
                                    </ul>
                                </div>
                                <div className="info-card">
                                    <h3>IoT Sensors</h3>
                                    <p>Your vitals are being monitored in real-time using connected health devices:</p>
                                    <ul>
                                        <li>✓ Heart rate monitor</li>
                                        <li>✓ Pulse oximeter (SpO2)</li>
                                        <li>✓ Body temperature sensor</li>
                                        <li>✓ Room temperature sensor</li>
                                        <li>✓ Humidity sensor</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* History View */}
                {activeTab === 'history' && (
                    <div className="history-view">
                        {isLoadingHistory ? (
                            <div className="loading-message">Loading history...</div>
                        ) : history.length === 0 ? (
                            <div className="no-data-message">
                                <p>📊 No vitals history available yet.</p>
                                <p>Vitals are automatically recorded every 3 seconds when you're viewing the Current Vitals tab.</p>
                            </div>
                        ) : (
                            <>
                                <div className="history-stats">
                                    <div className="stat-card">
                                        <span className="stat-label">Total Readings</span>
                                        <span className="stat-value">{history.length}</span>
                                    </div>
                                    <button 
                                        className="refresh-button"
                                        onClick={fetchHistory}
                                    >
                                        🔄 Refresh
                                    </button>
                                </div>

                                {/* Vitals Trend Charts */}
                                <div className="vitals-charts-section">
                                    <h3>📈 Vitals Trends</h3>
                                    <div className="vitals-charts-grid">
                                        <VitalsChart
                                            data={history.slice().reverse().map(v => ({
                                                value: v.heart_rate,
                                                timestamp: v.recorded_at,
                                                status: v.heart_rate_status
                                            }))}
                                            label="Heart Rate"
                                            unit="bpm"
                                            color="#e74c3c"
                                            minValue={50}
                                            maxValue={120}
                                        />
                                        <VitalsChart
                                            data={history.slice().reverse().map(v => ({
                                                value: v.spo2,
                                                timestamp: v.recorded_at,
                                                status: v.spo2_status
                                            }))}
                                            label="SpO2"
                                            unit="%"
                                            color="#3498db"
                                            minValue={90}
                                            maxValue={100}
                                        />
                                        <VitalsChart
                                            data={history.slice().reverse().map(v => ({
                                                value: v.body_temperature,
                                                timestamp: v.recorded_at,
                                                status: v.body_temperature_status
                                            }))}
                                            label="Body Temperature"
                                            unit="°C"
                                            color="#f39c12"
                                            minValue={35}
                                            maxValue={39}
                                        />
                                        <VitalsChart
                                            data={history.slice().reverse().map(v => ({
                                                value: v.humidity,
                                                timestamp: v.recorded_at,
                                                status: v.humidity_status
                                            }))}
                                            label="Humidity"
                                            unit="%"
                                            color="#27ae60"
                                            minValue={30}
                                            maxValue={80}
                                        />
                                    </div>
                                </div>

                                <div className="history-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date & Time</th>
                                                <th>Heart Rate</th>
                                                <th>SpO2</th>
                                                <th>Body Temp</th>
                                                <th>Room Temp</th>
                                                <th>Humidity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.map((record) => (
                                                <tr key={record.id}>
                                                    <td>{formatDate(record.recorded_at)}</td>
                                                    <td className={record.heart_rate_status}>
                                                        {getStatusIcon(record.heart_rate_status)} {record.heart_rate} bpm
                                                    </td>
                                                    <td className={record.spo2_status}>
                                                        {getStatusIcon(record.spo2_status)} {record.spo2}%
                                                    </td>
                                                    <td className={record.body_temperature_status}>
                                                        {getStatusIcon(record.body_temperature_status)} {record.body_temperature}°C
                                                    </td>
                                                    <td className={record.room_temperature_status}>
                                                        {getStatusIcon(record.room_temperature_status)} {record.room_temperature}°C
                                                    </td>
                                                    <td className={record.humidity_status}>
                                                        {getStatusIcon(record.humidity_status)} {record.humidity}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <Copyright />
        </div>
    );
}

export default PatientVitals;
