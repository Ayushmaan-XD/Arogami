import Navbar from "../Navbar/NavBar.tsx";
import Copyright from "../Copyright/Copyright.tsx";
import VitalsChart from "./VitalsChart.tsx";
import { useLoaderData } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import FallBackUi from "../Fallback/FallbackUi.js";
import "./PatientDataVisual.css";
function PatientDataVisual() {
  const role = useLoaderData();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7days' | '30days' | '90days'>('7days');
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'heartRate' | 'spo2' | 'temperature'>('all');
  const [liveData, setLiveData] = useState<{
    heartRate: any[];
    spo2: any[];
    temperature: any[];
  }>({ heartRate: [], spo2: [], temperature: [] });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const verifyRole = async () => {
      if (role === "patient") {
        navigate("/consultation/patient");
        return;
      }
      if (role === "noRole") {
        navigate("/consultation/doctor");
        return;
      }
      setIsLoading(false);
    };
    verifyRole();
  }, [role, navigate]);

  // Generate mock aggregated patient data
  const generateMockAggregatedData = (days: number) => {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.push({
        value: 70 + Math.random() * 15 + Math.sin(i / 3) * 5,
        timestamp: date.toISOString(),
        status: Math.random() > 0.9 ? 'warning' : 'normal'
      });
    }
    return data;
  };

  const generateSpo2Data = (days: number) => {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.push({
        value: 96 + Math.random() * 3,
        timestamp: date.toISOString(),
        status: 'normal'
      });
    }
    return data;
  };

  const generateTempData = (days: number) => {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.push({
        value: 36.5 + Math.random() * 0.8,
        timestamp: date.toISOString(),
        status: 'normal'
      });
    }
    return data;
  };

  // Initialize data when component mounts or time range changes
  useEffect(() => {
    const daysMap = {
      '7days': 7,
      '30days': 30,
      '90days': 90
    };
    const days = daysMap[selectedTimeRange];
    
    setLiveData({
      heartRate: generateMockAggregatedData(days),
      spo2: generateSpo2Data(days),
      temperature: generateTempData(days)
    });
  }, [selectedTimeRange]);

  // Update data every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(prevData => {
        const now = new Date();
        
        // Add new data point and remove oldest if we have enough
        const maxPoints = selectedTimeRange === '7days' ? 7 : selectedTimeRange === '30days' ? 30 : 90;
        
        // Generate new values with slight variation from last value
        const lastHR = prevData.heartRate[prevData.heartRate.length - 1]?.value || 75;
        const lastSpo2 = prevData.spo2[prevData.spo2.length - 1]?.value || 97;
        const lastTemp = prevData.temperature[prevData.temperature.length - 1]?.value || 36.8;
        
        const newHeartRate = {
          value: Math.max(60, Math.min(100, lastHR + (Math.random() - 0.5) * 5)),
          timestamp: now.toISOString(),
          status: Math.random() > 0.9 ? 'warning' : 'normal'
        };
        
        const newSpo2 = {
          value: Math.max(95, Math.min(100, lastSpo2 + (Math.random() - 0.5) * 1)),
          timestamp: now.toISOString(),
          status: 'normal'
        };
        
        const newTemp = {
          value: Math.max(36.0, Math.min(37.5, lastTemp + (Math.random() - 0.5) * 0.2)),
          timestamp: now.toISOString(),
          status: 'normal'
        };
        
        return {
          heartRate: [...prevData.heartRate.slice(-maxPoints + 1), newHeartRate],
          spo2: [...prevData.spo2.slice(-maxPoints + 1), newSpo2],
          temperature: [...prevData.temperature.slice(-maxPoints + 1), newTemp]
        };
      });
      
      setLastUpdate(new Date());
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const daysMap = {
    '7days': 7,
    '30days': 30,
    '90days': 90
  };

  const days = daysMap[selectedTimeRange];
  const heartRateData = liveData.heartRate;
  const spo2Data = liveData.spo2;
  const tempData = liveData.temperature;

  // Calculate statistics
  const calculateStats = (data: any[]) => {
    const values = data.map(d => d.value);
    return {
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
      min: Math.min(...values).toFixed(1),
      max: Math.max(...values).toFixed(1),
      trend: values[values.length - 1] > values[0] ? '↑' : '↓'
    };
  };

  const hrStats = calculateStats(heartRateData);
  const spo2Stats = calculateStats(spo2Data);
  const tempStats = calculateStats(tempData);

  if (isLoading) {
    return <FallBackUi />;
  }
  return (
    <>
      <Navbar isDoctor={true} isLogout={true} isPatient={false} />
      
      <div className="data-visual-wrapper">
        <div className="data-visual-container">
          {/* Header */}
          <div className="data-visual-header">
            <div>
              <h1 className="data-visual-title">Patient Data Visualization</h1>
              <p className="data-visual-subtitle">Aggregated patient vitals analytics and trends</p>
            </div>
            <button 
              className="back-button-visual"
              onClick={() => navigate('/consultation/doctor')}
            >
              ← Back to Portal
            </button>
          </div>

          {/* Filter Controls */}
          <div className="filter-controls">
            <div className="filter-group">
              <label>Time Range:</label>
              <div className="filter-buttons">
                <button 
                  className={selectedTimeRange === '7days' ? 'active' : ''}
                  onClick={() => setSelectedTimeRange('7days')}
                >
                  7 Days
                </button>
                <button 
                  className={selectedTimeRange === '30days' ? 'active' : ''}
                  onClick={() => setSelectedTimeRange('30days')}
                >
                  30 Days
                </button>
                <button 
                  className={selectedTimeRange === '90days' ? 'active' : ''}
                  onClick={() => setSelectedTimeRange('90days')}
                >
                  90 Days
                </button>
              </div>
            </div>
            
            <div className="filter-group">
              <label>Metric View:</label>
              <div className="filter-buttons">
                <button 
                  className={selectedMetric === 'all' ? 'active' : ''}
                  onClick={() => setSelectedMetric('all')}
                >
                  All Metrics
                </button>
                <button 
                  className={selectedMetric === 'heartRate' ? 'active' : ''}
                  onClick={() => setSelectedMetric('heartRate')}
                >
                  Heart Rate
                </button>
                <button 
                  className={selectedMetric === 'spo2' ? 'active' : ''}
                  onClick={() => setSelectedMetric('spo2')}
                >
                  SpO2
                </button>
                <button 
                  className={selectedMetric === 'temperature' ? 'active' : ''}
                  onClick={() => setSelectedMetric('temperature')}
                >
                  Temperature
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="stats-overview">
            <div className="stat-card-large">
              <div className="stat-icon">❤️</div>
              <div className="stat-content">
                <h3>Heart Rate</h3>
                <div className="stat-value">{hrStats.avg} <span className="unit">bpm</span></div>
                <div className="stat-details">
                  <span>Min: {hrStats.min}</span>
                  <span>Max: {hrStats.max}</span>
                  <span className={`trend ${hrStats.trend === '↑' ? 'up' : 'down'}`}>
                    {hrStats.trend} Trend
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card-large">
              <div className="stat-icon">💨</div>
              <div className="stat-content">
                <h3>SpO2 Level</h3>
                <div className="stat-value">{spo2Stats.avg} <span className="unit">%</span></div>
                <div className="stat-details">
                  <span>Min: {spo2Stats.min}</span>
                  <span>Max: {spo2Stats.max}</span>
                  <span className={`trend ${spo2Stats.trend === '↑' ? 'up' : 'down'}`}>
                    {spo2Stats.trend} Trend
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card-large">
              <div className="stat-icon">🌡️</div>
              <div className="stat-content">
                <h3>Body Temperature</h3>
                <div className="stat-value">{tempStats.avg} <span className="unit">°C</span></div>
                <div className="stat-details">
                  <span>Min: {tempStats.min}</span>
                  <span>Max: {tempStats.max}</span>
                  <span className={`trend ${tempStats.trend === '↑' ? 'up' : 'down'}`}>
                    {tempStats.trend} Trend
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            {(selectedMetric === 'all' || selectedMetric === 'heartRate') && (
              <VitalsChart
                data={heartRateData}
                label="Average Heart Rate Over Time"
                unit="bpm"
                color="#e74c3c"
                minValue={50}
                maxValue={120}
              />
            )}

            {(selectedMetric === 'all' || selectedMetric === 'spo2') && (
              <VitalsChart
                data={spo2Data}
                label="Average SpO2 Level Over Time"
                unit="%"
                color="#3498db"
                minValue={90}
                maxValue={100}
              />
            )}

            {(selectedMetric === 'all' || selectedMetric === 'temperature') && (
              <VitalsChart
                data={tempData}
                label="Average Body Temperature Over Time"
                unit="°C"
                color="#f39c12"
                minValue={35}
                maxValue={39}
              />
            )}
          </div>

          {/* Info Section */}
          <div className="info-section-visual">
            <div className="info-card-visual">
              <h3>📊 About This Data</h3>
              <p>This dashboard shows aggregated patient vitals data across all patients in the system. The data is averaged and anonymized to provide insights into overall patient health trends.</p>
              <ul>
                <li>Data is updated in real-time as patients record their vitals</li>
                <li>Trends help identify patterns in patient health metrics</li>
                <li>Use filters to focus on specific time ranges or metrics</li>
              </ul>
            </div>
            
            <div className="info-card-visual">
              <h3>🔍 Key Insights</h3>
              <ul>
                <li><strong>Normal Ranges:</strong> HR: 60-100 bpm, SpO2: 95-100%, Temp: 36-37.5°C</li>
                <li><strong>Warning Signs:</strong> Values outside normal ranges are flagged</li>
                <li><strong>Critical Alerts:</strong> Severe deviations require immediate attention</li>
                <li><strong>Trends:</strong> Monitor whether metrics are improving or declining</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Copyright />
    </>
  );
}

export default PatientDataVisual;
