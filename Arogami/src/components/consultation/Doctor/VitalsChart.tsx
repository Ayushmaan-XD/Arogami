import React from 'react';
import './VitalsChart.css';

interface DataPoint {
    value: number;
    timestamp: string;
    status?: string;
}

interface VitalsChartProps {
    data: DataPoint[];
    label: string;
    unit: string;
    color?: string;
    minValue?: number;
    maxValue?: number;
}

const VitalsChart: React.FC<VitalsChartProps> = ({
    data,
    label,
    unit,
    color = '#667eea',
    minValue,
    maxValue
}) => {
    if (!data || data.length === 0) {
        return <div className="chart-no-data">No data available</div>;
    }

    const chartWidth = 600;
    const chartHeight = 200;
    const padding = 40;
    const plotWidth = chartWidth - padding * 2;
    const plotHeight = chartHeight - padding * 2;

    // Calculate min and max values
    const values = data.map(d => d.value);
    const dataMin = minValue ?? Math.min(...values);
    const dataMax = maxValue ?? Math.max(...values);
    const range = dataMax - dataMin || 1;

    // Create points for the line
    const points = data.map((point, index) => {
        const x = padding + (index / (data.length - 1)) * plotWidth;
        const y = padding + plotHeight - ((point.value - dataMin) / range) * plotHeight;
        return { x, y, ...point };
    });

    // Create path for line chart
    const pathData = points
        .map((point, index) => {
            const command = index === 0 ? 'M' : 'L';
            return `${command} ${point.x} ${point.y}`;
        })
        .join(' ');

    // Create area fill path
    const areaPath = `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`;

    // Format timestamp for display
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="vitals-chart-container">
            <div className="chart-header">
                <h4>{label}</h4>
                <span className="chart-unit">{unit}</span>
            </div>
            <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="vitals-chart"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((fraction, index) => {
                    const y = padding + plotHeight * (1 - fraction);
                    const value = dataMin + range * fraction;
                    return (
                        <g key={index}>
                            <line
                                x1={padding}
                                y1={y}
                                x2={chartWidth - padding}
                                y2={y}
                                stroke="#e0e0e0"
                                strokeWidth="1"
                            />
                            <text
                                x={padding - 10}
                                y={y + 5}
                                textAnchor="end"
                                fontSize="12"
                                fill="#666"
                            >
                                {value.toFixed(0)}
                            </text>
                        </g>
                    );
                })}

                {/* Area fill */}
                <path
                    d={areaPath}
                    fill={color}
                    fillOpacity="0.1"
                />

                {/* Line */}
                <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data points */}
                {points.map((point, index) => {
                    const pointColor = 
                        point.status === 'critical' ? '#dc3545' :
                        point.status === 'warning' ? '#ffc107' :
                        color;
                    
                    return (
                        <g key={index}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="5"
                                fill={pointColor}
                                stroke="white"
                                strokeWidth="2"
                                className="chart-point"
                            />
                            {/* Show value on hover */}
                            <title>{`${label}: ${point.value.toFixed(1)} ${unit}\n${formatTime(point.timestamp)}`}</title>
                        </g>
                    );
                })}

                {/* X-axis labels (show first, middle, last) */}
                {[0, Math.floor(points.length / 2), points.length - 1].map((index) => {
                    if (index >= points.length) return null;
                    const point = points[index];
                    return (
                        <text
                            key={index}
                            x={point.x}
                            y={chartHeight - padding + 20}
                            textAnchor="middle"
                            fontSize="11"
                            fill="#666"
                        >
                            {formatTime(point.timestamp)}
                        </text>
                    );
                })}

                {/* Axes */}
                <line
                    x1={padding}
                    y1={padding}
                    x2={padding}
                    y2={chartHeight - padding}
                    stroke="#333"
                    strokeWidth="2"
                />
                <line
                    x1={padding}
                    y1={chartHeight - padding}
                    x2={chartWidth - padding}
                    y2={chartHeight - padding}
                    stroke="#333"
                    strokeWidth="2"
                />
            </svg>
            <div className="chart-legend">
                <span className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: color }}></span>
                    Latest: {data[data.length - 1].value.toFixed(1)} {unit}
                </span>
            </div>
        </div>
    );
};

export default VitalsChart;
