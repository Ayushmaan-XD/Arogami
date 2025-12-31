import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './VitalsDashboard.css';

interface VitalData {
    timestamp: string;
    heartRate: number;
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    temperature: number;
    oxygenSaturation: number;
    respiratoryRate: number;
}

interface VitalRange {
    min: number;
    max: number;
    unit: string;
    icon: string;
}

const VITAL_RANGES: Record<string, VitalRange> = {
    heartRate: { min: 60, max: 100, unit: 'bpm', icon: '💓' },
    bloodPressureSystolic: { min: 90, max: 120, unit: 'mmHg', icon: '🩸' },
    bloodPressureDiastolic: { min: 60, max: 80, unit: 'mmHg', icon: '🩸' },
    temperature: { min: 36.1, max: 37.2, unit: '°C', icon: '🌡️' },
    oxygenSaturation: { min: 95, max: 100, unit: '%', icon: '🫁' },
    respiratoryRate: { min: 12, max: 20, unit: '/min', icon: '🫁' }
};

const VitalsDashboard = () => {
    const [vitalsData, setVitalsData] = useState<VitalData[]>([]);
    const [currentVitals, setCurrentVitals] = useState<VitalData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [selectedVital, setSelectedVital] = useState<string>('heartRate');

    // Simulate IoT sensor data
    useEffect(() => {
        setIsConnected(true);
        
        const generateVitalData = (): VitalData => {
            const now = new Date();
            return {
                timestamp: now.toLocaleTimeString(),
                heartRate: Math.floor(Math.random() * 40 + 60), // 60-100
                bloodPressureSystolic: Math.floor(Math.random() * 30 + 90), // 90-120
                bloodPressureDiastolic: Math.floor(Math.random() * 20 + 60), // 60-80
                temperature: parseFloat((Math.random() * 1.5 + 36).toFixed(1)), // 36-37.5
                oxygenSaturation: Math.floor(Math.random() * 5 + 95), // 95-100
                respiratoryRate: Math.floor(Math.random() * 8 + 12) // 12-20
            };
        };

        // Initial data
        const initialData: VitalData[] = [];
        for (let i = 0; i < 10; i++) {
            initialData.push(generateVitalData());
        }
        setVitalsData(initialData);
        setCurrentVitals(initialData[initialData.length - 1]);

        // Update every 3 seconds (simulating real-time sensor data)
        const interval = setInterval(() => {
            const newVital = generateVitalData();
            setVitalsData(prev => {
                const updated = [...prev, newVital];
                return updated.slice(-20); // Keep last 20 readings
            });
            setCurrentVitals(newVital);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const getVitalStatus = (value: number, vitalType: string): 'normal' | 'warning' | 'critical' => {
        const range = VITAL_RANGES[vitalType];
        if (!range) return 'normal';
        
        if (value < range.min || value > range.max) {
            if (Math.abs(value - range.min) > 10 || Math.abs(value - range.max) > 10) {
                return 'critical';
            }
            return 'warning';
        }
        return 'normal';
    };

    const formatBloodPressure = () => {
        if (!currentVitals) return 'N/A';
        return `${currentVitals.bloodPressureSystolic}/${currentVitals.bloodPressureDiastolic}`;
    };

    const VitalCard = ({ 
        title, 
        value, 
        unit, 
        icon, 
        status,
        vitalKey 
    }: { 
        title: string; 
        value: number | string; 
        unit: string; 
        icon: string; 
        status: 'normal' | 'warning' | 'critical';
        vitalKey: string;
    }) => (
        <div 
            className={`vital-card ${status} ${selectedVital === vitalKey ? 'selected' : ''}`}
            onClick={() => setSelectedVital(vitalKey)}
        >
            <div className="vital-icon">{icon}</div>
            <div className="vital-content">
                <div className="vital-title">{title}</div>
                <div className="vital-value">
                    {value} <span className="vital-unit">{unit}</span>
                </div>
                <div className={`vital-status-badge ${status}`}>
                    {status === 'normal' ? '✓ Normal' : status === 'warning' ? '⚠ Warning' : '🚨 Critical'}
                </div>
            </div>
        </div>
    );

    return (
        <div className="vitals-dashboard">
            <div className="vitals-header">
                <div className="header-content">
                    <h1 className="vitals-title">📊 Live Vitals Monitor</h1>
                    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        <span className="status-indicator"></span>
                        {isConnected ? 'IoT Sensors Connected' : 'Disconnected'}
                    </div>
                </div>
                <div className="last-update">
                    Last updated: {currentVitals?.timestamp || 'N/A'}
                </div>
            </div>

            {/* Current Vitals Grid */}
            <div className="vitals-grid">
                {currentVitals && (
                    <>
                        <VitalCard
                            title="Heart Rate"
                            value={currentVitals.heartRate}
                            unit={VITAL_RANGES.heartRate.unit}
                            icon={VITAL_RANGES.heartRate.icon}
                            status={getVitalStatus(currentVitals.heartRate, 'heartRate')}
                            vitalKey="heartRate"
                        />
                        <VitalCard
                            title="Blood Pressure"
                            value={formatBloodPressure()}
                            unit={VITAL_RANGES.bloodPressureSystolic.unit}
                            icon={VITAL_RANGES.bloodPressureSystolic.icon}
                            status={getVitalStatus(currentVitals.bloodPressureSystolic, 'bloodPressureSystolic')}
                            vitalKey="bloodPressure"
                        />
                        <VitalCard
                            title="Temperature"
                            value={currentVitals.temperature}
                            unit={VITAL_RANGES.temperature.unit}
                            icon={VITAL_RANGES.temperature.icon}
                            status={getVitalStatus(currentVitals.temperature, 'temperature')}
                            vitalKey="temperature"
                        />
                        <VitalCard
                            title="O₂ Saturation"
                            value={currentVitals.oxygenSaturation}
                            unit={VITAL_RANGES.oxygenSaturation.unit}
                            icon={VITAL_RANGES.oxygenSaturation.icon}
                            status={getVitalStatus(currentVitals.oxygenSaturation, 'oxygenSaturation')}
                            vitalKey="oxygenSaturation"
                        />
                        <VitalCard
                            title="Respiratory Rate"
                            value={currentVitals.respiratoryRate}
                            unit={VITAL_RANGES.respiratoryRate.unit}
                            icon={VITAL_RANGES.respiratoryRate.icon}
                            status={getVitalStatus(currentVitals.respiratoryRate, 'respiratoryRate')}
                            vitalKey="respiratoryRate"
                        />
                    </>
                )}
            </div>

            {/* Live Chart */}
            <div className="chart-container">
                <div className="chart-header">
                    <h2>Real-time Monitoring</h2>
                    <div className="chart-legend">
                        <span className="legend-item">
                            <span className="legend-dot normal"></span> Normal Range
                        </span>
                        <span className="legend-item">
                            <span className="legend-dot warning"></span> Warning
                        </span>
                        <span className="legend-item">
                            <span className="legend-dot critical"></span> Critical
                        </span>
                    </div>
                </div>
                
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={vitalsData}>
                        <defs>
                            <linearGradient id="colorVital" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                            dataKey="timestamp" 
                            stroke="#666"
                            style={{ fontSize: '0.85rem' }}
                        />
                        <YAxis 
                            stroke="#666"
                            style={{ fontSize: '0.85rem' }}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#fff', 
                                border: '2px solid #667eea',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey={selectedVital}
                            stroke="#667eea"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorVital)"
                            animationDuration={500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Quick Stats */}
            <div className="stats-section">
                <h3>Session Summary</h3>
                <div className="stats-grid">
                    <div className="stat-item">
                        <div className="stat-label">Average Heart Rate</div>
                        <div className="stat-value">
                            {vitalsData.length > 0 
                                ? Math.round(vitalsData.reduce((sum, v) => sum + v.heartRate, 0) / vitalsData.length)
                                : 0} bpm
                        </div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">Average O₂ Saturation</div>
                        <div className="stat-value">
                            {vitalsData.length > 0 
                                ? Math.round(vitalsData.reduce((sum, v) => sum + v.oxygenSaturation, 0) / vitalsData.length)
                                : 0}%
                        </div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">Readings Collected</div>
                        <div className="stat-value">{vitalsData.length}</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">Session Duration</div>
                        <div className="stat-value">{Math.floor(vitalsData.length * 3 / 60)} min</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VitalsDashboard;
