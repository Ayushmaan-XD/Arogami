import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Navbar/NavBar';
import Copyright from '../Copyright/Copyright';
import FallBackUi from '../Fallback/FallbackUi';
import VitalsChart from './VitalsChart';
import { BACKEND_URL } from '../services/api';
import './PatientRecords.css';

interface PatientRecord {
    _id: string;
    email: string;
    uuid: string;
    picture?: string;
    ip?: string;
    createdAt?: string;
    updatedAt?: string;
    consultationRequests: number;
    lastRequest?: string;
}

interface FilterOptions {
    minConsultations: number;
    maxConsultations: number;
    dateFrom: string;
    dateTo: string;
}

function PatientRecords() {
    const navigate = useNavigate();
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<PatientRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState<'createdAt' | 'email' | 'consultationRequests'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({
        minConsultations: 0,
        maxConsultations: 999,
        dateFrom: '',
        dateTo: ''
    });
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
    const [patientVitals, setPatientVitals] = useState<any[]>([]);
    const [vitalsStats, setVitalsStats] = useState<any>(null);
    const [loadingVitals, setLoadingVitals] = useState(false);

    useEffect(() => {
        fetchRecords();
    }, []);

    useEffect(() => {
        // Filter records based on search term and filters
        let filtered = records;

        // Search filter
        if (searchTerm.trim() !== '') {
            filtered = filtered.filter(record =>
                record.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.uuid.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Consultation count filter
        filtered = filtered.filter(record =>
            record.consultationRequests >= filters.minConsultations &&
            record.consultationRequests <= filters.maxConsultations
        );

        // Date range filter
        if (filters.dateFrom) {
            filtered = filtered.filter(record => {
                const recordDate = new Date(record.createdAt || '');
                return recordDate >= new Date(filters.dateFrom);
            });
        }
        if (filters.dateTo) {
            filtered = filtered.filter(record => {
                const recordDate = new Date(record.createdAt || '');
                return recordDate <= new Date(filters.dateTo);
            });
        }

        setFilteredRecords(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchTerm, records, filters]);

    const generateMockPatients = (): PatientRecord[] => {
        const mockData: PatientRecord[] = [
            {
                _id: '1',
                email: 'john.doe@example.com',
                uuid: 'PAT001',
                picture: '',
                ip: '192.168.1.100',
                createdAt: new Date(2024, 0, 15).toISOString(),
                updatedAt: new Date(2024, 10, 10).toISOString(),
                consultationRequests: 5,
                lastRequest: new Date(2024, 10, 10).toISOString()
            },
            {
                _id: '2',
                email: 'sarah.smith@example.com',
                uuid: 'PAT002',
                picture: '',
                ip: '192.168.1.101',
                createdAt: new Date(2024, 1, 20).toISOString(),
                updatedAt: new Date(2024, 10, 15).toISOString(),
                consultationRequests: 12,
                lastRequest: new Date(2024, 10, 15).toISOString()
            },
            {
                _id: '3',
                email: 'mike.johnson@example.com',
                uuid: 'PAT003',
                picture: '',
                ip: '192.168.1.102',
                createdAt: new Date(2024, 2, 5).toISOString(),
                updatedAt: new Date(2024, 10, 12).toISOString(),
                consultationRequests: 3,
                lastRequest: new Date(2024, 10, 12).toISOString()
            },
            {
                _id: '4',
                email: 'emily.davis@example.com',
                uuid: 'PAT004',
                picture: '',
                ip: '192.168.1.103',
                createdAt: new Date(2024, 3, 10).toISOString(),
                updatedAt: new Date(2024, 10, 18).toISOString(),
                consultationRequests: 8,
                lastRequest: new Date(2024, 10, 18).toISOString()
            },
            {
                _id: '5',
                email: 'david.wilson@example.com',
                uuid: 'PAT005',
                picture: '',
                ip: '192.168.1.104',
                createdAt: new Date(2024, 4, 25).toISOString(),
                updatedAt: new Date(2024, 10, 8).toISOString(),
                consultationRequests: 15,
                lastRequest: new Date(2024, 10, 8).toISOString()
            },
            {
                _id: '6',
                email: 'lisa.brown@example.com',
                uuid: 'PAT006',
                picture: '',
                ip: '192.168.1.105',
                createdAt: new Date(2024, 5, 1).toISOString(),
                updatedAt: new Date(2024, 10, 20).toISOString(),
                consultationRequests: 6,
                lastRequest: new Date(2024, 10, 20).toISOString()
            },
            {
                _id: '7',
                email: 'robert.taylor@example.com',
                uuid: 'PAT007',
                picture: '',
                ip: '192.168.1.106',
                createdAt: new Date(2024, 6, 14).toISOString(),
                updatedAt: new Date(2024, 10, 5).toISOString(),
                consultationRequests: 2,
                lastRequest: new Date(2024, 10, 5).toISOString()
            },
            {
                _id: '8',
                email: 'jennifer.martinez@example.com',
                uuid: 'PAT008',
                picture: '',
                ip: '192.168.1.107',
                createdAt: new Date(2024, 7, 22).toISOString(),
                updatedAt: new Date(2024, 10, 16).toISOString(),
                consultationRequests: 10,
                lastRequest: new Date(2024, 10, 16).toISOString()
            }
        ];
        return mockData;
    };

    const fetchRecords = async () => {
        try {
            setIsLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            
            if (!token) {
                navigate('/consultation/doctor');
                return;
            }

            // Try to fetch real data, fallback to mock if fails
            try {
                const response = await axios.post(`${BACKEND_URL}/api/patient-records/records`, {
                    token,
                    limit: 100,
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                });

                if (response.data.success && response.data.records.length > 0) {
                    setRecords(response.data.records);
                    setFilteredRecords(response.data.records);
                    setLastUpdated(new Date());
                } else {
                    // Use mock data if no records
                    const mockData = generateMockPatients();
                    setRecords(mockData);
                    setFilteredRecords(mockData);
                    setLastUpdated(new Date());
                }
            } catch (fetchError) {
                // Use mock data on fetch error
                const mockData = generateMockPatients();
                setRecords(mockData);
                setFilteredRecords(mockData);
                setLastUpdated(new Date());
            }
        } catch (err: any) {
            console.error('Error fetching records:', err);
            setError(err.response?.data?.error || 'Failed to fetch patient records');
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/consultation/doctor');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (field: 'createdAt' | 'email' | 'consultationRequests') => {
        const newSortOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
        setSortBy(field);
        setSortOrder(newSortOrder);

        const sorted = [...filteredRecords].sort((a, b) => {
            let aVal: any = a[field];
            let bVal: any = b[field];

            if (field === 'createdAt') {
                aVal = new Date(aVal || 0).getTime();
                bVal = new Date(bVal || 0).getTime();
            } else if (field === 'email') {
                aVal = aVal?.toLowerCase() || '';
                bVal = bVal?.toLowerCase() || '';
            }

            if (newSortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        setFilteredRecords(sorted);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const fetchPatientVitals = async (patientId: string) => {
        setLoadingVitals(true);
        try {
            const token = localStorage.getItem('token');
            
            // Try to fetch real data
            try {
                const response = await axios.get(`${BACKEND_URL}/api/vitals/patient/${patientId}?limit=20`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.data.success && response.data.history.length > 0) {
                    setPatientVitals(response.data.history || []);
                    setVitalsStats(response.data.stats);
                } else {
                    // Use mock vitals data
                    const mockVitals = generateMockVitals(patientId);
                    setPatientVitals(mockVitals.history);
                    setVitalsStats(mockVitals.stats);
                }
            } catch (fetchError) {
                // Use mock vitals data on error
                const mockVitals = generateMockVitals(patientId);
                setPatientVitals(mockVitals.history);
                setVitalsStats(mockVitals.stats);
            }
        } catch (error) {
            console.error('Failed to fetch patient vitals:', error);
            setPatientVitals([]);
            setVitalsStats(null);
        } finally {
            setLoadingVitals(false);
        }
    };

    const generateMockVitals = (patientId: string) => {
        const now = new Date();
        const history = [];
        const statuses = ['normal', 'normal', 'normal', 'warning', 'normal'];
        
        // Generate 20 mock vitals readings over the past 7 days
        for (let i = 0; i < 20; i++) {
            const hoursAgo = i * 8; // Every 8 hours
            const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
            const statusIndex = Math.floor(Math.random() * statuses.length);
            
            history.push({
                id: i + 1,
                heart_rate: 60 + Math.floor(Math.random() * 30),
                heart_rate_status: statuses[statusIndex],
                spo2: 95 + Math.random() * 4,
                spo2_status: statuses[statusIndex],
                body_temperature: 36.5 + Math.random() * 0.8,
                body_temperature_status: statuses[statusIndex],
                room_temperature: 20 + Math.random() * 6,
                room_temperature_status: 'normal',
                humidity: 45 + Math.floor(Math.random() * 20),
                humidity_status: 'normal',
                recorded_at: timestamp.toISOString()
            });
        }

        const stats = {
            total_readings: 20,
            avg_heart_rate: 72,
            min_heart_rate: 62,
            max_heart_rate: 88,
            avg_spo2: 97.5,
            min_spo2: 95.2,
            max_spo2: 99.1,
            avg_body_temperature: 36.8,
            min_body_temperature: 36.5,
            max_body_temperature: 37.2,
            avg_room_temperature: 23,
            avg_humidity: 55,
            critical_readings: Math.floor(Math.random() * 2)
        };

        return { history, stats };
    };

    const handlePatientSelect = (patient: PatientRecord) => {
        setSelectedPatient(patient);
        fetchPatientVitals(patient.uuid);
    };

    const exportToCSV = () => {
        const headers = ['Email', 'Patient ID', 'Consultations', 'Registered', 'Last Updated'];
        const csvData = filteredRecords.map(record => [
            record.email,
            record.uuid,
            record.consultationRequests,
            record.createdAt || 'N/A',
            record.updatedAt || 'N/A'
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patient-records-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const clearFilters = () => {
        setFilters({
            minConsultations: 0,
            maxConsultations: 999,
            dateFrom: '',
            dateTo: ''
        });
        setSearchTerm('');
    };

    const getStats = () => {
        const totalPatients = records.length;
        const totalConsultations = records.reduce((sum, r) => sum + r.consultationRequests, 0);
        const avgConsultations = totalPatients > 0 ? (totalConsultations / totalPatients).toFixed(1) : 0;
        const activePatients = records.filter(r => r.consultationRequests > 0).length;

        return { totalPatients, totalConsultations, avgConsultations, activePatients };
    };

    // Pagination
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    if (isLoading) {
        return <FallBackUi />;
    }

    const stats = getStats();

    return (
        <div className="patient-records-wrapper">
            <Navbar isDoctor={true} isLogout={true} isPatient={false} />
            
            <div className="patient-records-container">
                <div className="patient-records-header">
                    <h1 className="patient-records-title">Patient Records</h1>
                    <div className="header-actions">
                        <button 
                            className="refresh-button"
                            onClick={fetchRecords}
                            title="Refresh data"
                        >
                            🔄 Refresh
                        </button>
                        <button 
                            className="export-button"
                            onClick={exportToCSV}
                            title="Export to CSV"
                        >
                            📊 Export CSV
                        </button>
                        <button 
                            className="back-button"
                            onClick={() => navigate('/consultation/doctor')}
                        >
                            ← Back
                        </button>
                    </div>
                </div>

                {/* Statistics Dashboard */}
                <div className="stats-dashboard">
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.totalPatients}</div>
                            <div className="stat-label">Total Patients</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.activePatients}</div>
                            <div className="stat-label">Active Patients</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📋</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.totalConsultations}</div>
                            <div className="stat-label">Total Consultations</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.avgConsultations}</div>
                            <div className="stat-label">Avg per Patient</div>
                        </div>
                    </div>
                </div>

                <div className="last-updated">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Search and Filter Section */}
                <div className="controls-section">
                    <div className="search-bar">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by email or Patient ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <button 
                        className="filter-toggle-button"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? '▼' : '▶'} Filters
                    </button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="filters-panel">
                        <div className="filter-group">
                            <label>Consultation Range:</label>
                            <div className="filter-range">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.minConsultations}
                                    onChange={(e) => setFilters({...filters, minConsultations: parseInt(e.target.value) || 0})}
                                    className="filter-input"
                                />
                                <span>to</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.maxConsultations}
                                    onChange={(e) => setFilters({...filters, maxConsultations: parseInt(e.target.value) || 999})}
                                    className="filter-input"
                                />
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Date Range:</label>
                            <div className="filter-range">
                                <input
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                                    className="filter-input"
                                />
                                <span>to</span>
                                <input
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                                    className="filter-input"
                                />
                            </div>
                        </div>

                        <button className="clear-filters-button" onClick={clearFilters}>
                            Clear All Filters
                        </button>
                    </div>
                )}

                <div className="records-stats">
                    <p>Showing {currentRecords.length} of {filteredRecords.length} patients (Total: {records.length})</p>
                </div>

                <div className="table-container">
                    <table className="records-table">
                        <thead>
                            <tr>
                                <th>Profile</th>
                                <th 
                                    onClick={() => handleSort('email')}
                                    className="sortable"
                                >
                                    Email {sortBy === 'email' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </th>
                                <th>Patient ID</th>
                                <th 
                                    onClick={() => handleSort('consultationRequests')}
                                    className="sortable"
                                >
                                    Consultations {sortBy === 'consultationRequests' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </th>
                                <th 
                                    onClick={() => handleSort('createdAt')}
                                    className="sortable"
                                >
                                    Registered {sortBy === 'createdAt' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="no-records">
                                        {searchTerm || filters.dateFrom || filters.dateTo ? 
                                            'No patients found matching your criteria' : 
                                            'No patient records found'}
                                    </td>
                                </tr>
                            ) : (
                                currentRecords.map((record) => (
                                    <tr key={record._id} className="record-row">
                                        <td>
                                            {record.picture ? (
                                                <img 
                                                    src={record.picture} 
                                                    alt="Profile" 
                                                    className="profile-pic"
                                                />
                                            ) : (
                                                <div className="profile-pic-placeholder">
                                                    {record.email.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="email-cell">{record.email}</td>
                                        <td className="uuid-cell">{record.uuid}</td>
                                        <td className="consultations-cell">
                                            <span className={`consultation-badge ${record.consultationRequests > 0 ? 'active' : ''}`}>
                                                {record.consultationRequests}
                                            </span>
                                        </td>
                                        <td className="date-cell">{formatDate(record.createdAt)}</td>
                                        <td>
                                            <button 
                                                className="view-button"
                                                onClick={() => handlePatientSelect(record)}
                                                title="View Details"
                                            >
                                                👁️ View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="pagination">
                        <button 
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="pagination-button"
                        >
                            ← Previous
                        </button>
                        
                        <div className="pagination-numbers">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                <button
                                    key={number}
                                    onClick={() => paginate(number)}
                                    className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                                >
                                    {number}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="pagination-button"
                        >
                            Next →
                        </button>
                    </div>
                )}

                {/* Patient Detail Modal */}
                {selectedPatient && (
                    <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Patient Details</h2>
                                <button className="modal-close" onClick={() => setSelectedPatient(null)}>✕</button>
                            </div>
                            <div className="modal-body">
                                <div className="patient-detail-section">
                                    <div className="patient-profile-large">
                                        {selectedPatient.picture ? (
                                            <img src={selectedPatient.picture} alt="Profile" />
                                        ) : (
                                            <div className="profile-large-placeholder">
                                                {selectedPatient.email.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="patient-info">
                                        <div className="info-row">
                                            <strong>Email:</strong> {selectedPatient.email}
                                        </div>
                                        <div className="info-row">
                                            <strong>Patient ID:</strong> {selectedPatient.uuid}
                                        </div>
                                        <div className="info-row">
                                            <strong>Total Consultations:</strong> 
                                            <span className="consultation-badge active">{selectedPatient.consultationRequests}</span>
                                        </div>
                                        <div className="info-row">
                                            <strong>Registered:</strong> {formatDate(selectedPatient.createdAt)}
                                        </div>
                                        <div className="info-row">
                                            <strong>Last Updated:</strong> {formatDate(selectedPatient.updatedAt)}
                                        </div>
                                        {selectedPatient.lastRequest && (
                                            <div className="info-row">
                                                <strong>Last Request:</strong> {formatDate(selectedPatient.lastRequest)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Vitals Section */}
                                <div className="patient-vitals-section">
                                    <h3>📊 Recent Vital Signs</h3>
                                    {loadingVitals ? (
                                        <div className="vitals-loading">Loading vitals...</div>
                                    ) : patientVitals.length === 0 ? (
                                        <div className="no-vitals-message">
                                            <p>No vital signs recorded yet for this patient.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {vitalsStats && (
                                                <div className="vitals-stats-grid">
                                                    <div className="vitals-stat-card">
                                                        <span className="stat-label">Total Readings</span>
                                                        <span className="stat-value">{vitalsStats.total_readings || 0}</span>
                                                    </div>
                                                    <div className="vitals-stat-card">
                                                        <span className="stat-label">Avg Heart Rate</span>
                                                        <span className="stat-value">{Math.round(vitalsStats.avg_heart_rate || 0)} bpm</span>
                                                    </div>
                                                    <div className="vitals-stat-card">
                                                        <span className="stat-label">Avg SpO2</span>
                                                        <span className="stat-value">{Number(vitalsStats.avg_spo2 || 0).toFixed(1)}%</span>
                                                    </div>
                                                    <div className="vitals-stat-card critical">
                                                        <span className="stat-label">Critical Readings</span>
                                                        <span className="stat-value">{vitalsStats.critical_readings || 0}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Vitals Charts */}
                                            <div className="vitals-charts-grid">
                                                <VitalsChart
                                                    data={patientVitals.map(v => ({
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
                                                    data={patientVitals.map(v => ({
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
                                                    data={patientVitals.map(v => ({
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
                                            </div>

                                            <div className="vitals-history-table">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Date & Time</th>
                                                            <th>HR</th>
                                                            <th>SpO2</th>
                                                            <th>Body Temp</th>
                                                            <th>Room Temp</th>
                                                            <th>Humidity</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {patientVitals.slice(0, 10).map((vital: any) => (
                                                            <tr key={vital.id}>
                                                                <td>{new Date(vital.recorded_at).toLocaleString()}</td>
                                                                <td className={vital.heart_rate_status}>
                                                                    {vital.heart_rate} bpm
                                                                </td>
                                                                <td className={vital.spo2_status}>
                                                                    {vital.spo2}%
                                                                </td>
                                                                <td className={vital.body_temperature_status}>
                                                                    {vital.body_temperature}°C
                                                                </td>
                                                                <td className={vital.room_temperature_status}>
                                                                    {vital.room_temperature}°C
                                                                </td>
                                                                <td className={vital.humidity_status}>
                                                                    {vital.humidity}%
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Copyright />
        </div>
    );
}

export default PatientRecords;
