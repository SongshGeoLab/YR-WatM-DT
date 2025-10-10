export default function WaterQualityPage() {
  // Mock water quality data
  const qualityParameters = [
    { name: 'pH', value: 7.2, standard: 7.5, unit: '', status: 'good' },
    { name: 'Dissolved Oxygen', value: 6.8, standard: 6.0, unit: 'mg/L', status: 'good' },
    { name: 'BOD', value: 3.2, standard: 3.0, unit: 'mg/L', status: 'moderate' },
    { name: 'Nitrates', value: 8.5, standard: 10.0, unit: 'mg/L', status: 'good' },
    { name: 'Phosphates', value: 0.8, standard: 0.5, unit: 'mg/L', status: 'poor' },
    { name: 'Heavy Metals', value: 0.02, standard: 0.01, unit: 'mg/L', status: 'poor' }
  ];

  const pollutionSources = [
    { source: 'Industrial Discharge', contribution: 35, trend: 'decreasing' },
    { source: 'Agricultural Runoff', contribution: 28, trend: 'stable' },
    { source: 'Urban Sewage', contribution: 22, trend: 'increasing' },
    { source: 'Mining Activities', contribution: 10, trend: 'stable' },
    { source: 'Shipping/Transport', contribution: 5, trend: 'stable' }
  ];

  const sedimentData = [
    { location: 'Upper Reaches', load: 45, size: 'Fine sand', quality: 'clean' },
    { location: 'Three Gorges', load: 120, size: 'Silt/Clay', quality: 'moderate' },
    { location: 'Middle Reaches', load: 95, size: 'Mixed', quality: 'contaminated' },
    { location: 'Delta Region', load: 180, size: 'Fine silt', quality: 'heavily contaminated' }
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const wqiData = [72, 68, 65, 62, 58, 55, 53, 56, 61, 67, 70, 74];
  const maxWQI = 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'clean': return 'bg-green-400';
      case 'moderate': return 'bg-yellow-400';
      case 'contaminated': return 'bg-orange-400';
      case 'heavily contaminated': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'decreasing': return 'text-green-600';
      case 'increasing': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'decreasing': return '↓';
      case 'increasing': return '↑';
      default: return '→';
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white">
          7
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Water Quality and Sediment Analysis</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-5rem)]">
        {/* Left side - Water quality monitoring */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Water Quality Index Trends</h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-3">
                Yellow River is famous for its sediment load and with limited flow, here you can compare its ratio to other major river basins around the world.
              </div>

              {/* WQI trend chart */}
              <div className="h-48 relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-3">
                  <span>100</span>
                  <span>75</span>
                  <span>50</span>
                  <span>25</span>
                  <span>0</span>
                </div>

                {/* Chart content */}
                <div className="ml-8 h-full relative">
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((fraction, index) => (
                    <div
                      key={index}
                      className="absolute w-full border-t border-gray-200"
                      style={{ bottom: `${fraction * 100}%` }}
                    />
                  ))}

                  {/* WQI line chart */}
                  <svg className="absolute inset-0 w-full h-full">
                    {/* WQI trend line */}
                    <polyline
                      points={months.map((month, index) => {
                        const x = (index / (months.length - 1)) * 100;
                        const y = 100 - (wqiData[index] / maxWQI) * 100;
                        return `${x}% ${y}%`;
                      }).join(' ')}
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                    />

                    {/* Data points with color coding */}
                    {months.map((month, index) => {
                      const x = (index / (months.length - 1)) * 100;
                      const y = 100 - (wqiData[index] / maxWQI) * 100;
                      const wqi = wqiData[index];
                      const color = wqi >= 70 ? '#10b981' : wqi >= 50 ? '#f59e0b' : '#ef4444';

                      return (
                        <circle
                          key={index}
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="5"
                          fill={color}
                          stroke="white"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </svg>

                  {/* X-axis labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
                    {months.map((month) => (
                      <span key={month}>{month}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* WQI legend */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Good (70-100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Moderate (50-69)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Poor (<50)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Water quality parameters */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Current Water Quality Parameters</h4>
            <div className="space-y-2">
              {qualityParameters.map((param, index) => (
                <div key={param.name} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{param.name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(param.status)}`}>
                      {param.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-semibold">{param.value}</span>
                      <span className="text-gray-500 ml-1">{param.unit}</span>
                    </div>
                    <div className="text-gray-500">
                      Standard: {param.standard} {param.unit}
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          param.status === 'good' ? 'bg-green-500' :
                          param.status === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((param.value / param.standard) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pollution sources */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Pollution Sources</h4>
            <div className="space-y-2">
              {pollutionSources.map((source, index) => (
                <div key={source.source} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">{source.source}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${getTrendColor(source.trend)}`}>
                        {getTrendIcon(source.trend)}
                      </span>
                      <span className="text-sm font-semibold">{source.contribution}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${source.contribution}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Sediment analysis */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Sediment Transport Analysis</h3>

            {/* Sediment bubble chart */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-700 mb-3">Discharge & Sediment Load by Location</h4>

              <div className="h-64 relative bg-white rounded border">
                <svg className="absolute inset-0 w-full h-full">
                  {sedimentData.map((item, index) => {
                    const x = 20 + (index * 60);
                    const y = 200 - (item.load / 2);
                    const radius = Math.max(15, item.load / 8);

                    return (
                      <g key={item.location}>
                        <circle
                          cx={x}
                          cy={y}
                          r={radius}
                          className={`${getQualityColor(item.quality)} opacity-70`}
                          stroke="white"
                          strokeWidth="2"
                        />
                        <text
                          x={x}
                          y={y + 4}
                          textAnchor="middle"
                          className="text-xs fill-white font-medium"
                        >
                          {item.load}
                        </text>
                        <text
                          x={x}
                          y={240}
                          textAnchor="middle"
                          className="text-xs fill-gray-600"
                        >
                          {item.location}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Y-axis label */}
                <div className="absolute left-2 top-1/2 transform -rotate-90 -translate-y-1/2 text-xs text-gray-500">
                  Sediment Load (Mt/year)
                </div>
              </div>

              {/* Sediment legend */}
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>Clean</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span>Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                  <span>Contaminated</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span>Heavily Contaminated</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sediment characteristics */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Sediment Characteristics</h4>
            <div className="space-y-3">
              {sedimentData.map((item, index) => (
                <div key={item.location} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-800">{item.location}</h5>
                    <span className={`px-2 py-1 rounded text-xs text-white ${getQualityColor(item.quality)}`}>
                      {item.quality}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Sediment Load</div>
                      <div className="font-semibold">{item.load} Mt/year</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Particle Size</div>
                      <div className="font-semibold">{item.size}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Treatment efficiency */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Treatment Efficiency</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-800">78%</div>
                <div className="text-sm text-green-700">Wastewater treatment</div>
                <div className="text-xs text-green-600">Municipal plants</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-800">65%</div>
                <div className="text-sm text-blue-700">Industrial treatment</div>
                <div className="text-xs text-blue-600">Compliance rate</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-800">42%</div>
                <div className="text-sm text-yellow-700">Agricultural runoff</div>
                <div className="text-xs text-yellow-600">Treatment coverage</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-800">155</div>
                <div className="text-sm text-purple-700">Monitoring stations</div>
                <div className="text-xs text-purple-600">Active network</div>
              </div>
            </div>
          </div>

          {/* Water quality trends */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 mb-3">Key Quality Trends</h4>
            <div className="text-sm text-orange-800 space-y-2">
              <div>• Heavy metal contamination increasing in industrial areas</div>
              <div>• Nutrient pollution from agriculture remains high</div>
              <div>• Sediment load reduced by 40% due to dam construction</div>
              <div>• Urban water treatment capacity improved significantly</div>
              <div>• Microplastic pollution emerging as new concern</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
