export default function EcologicalWaterPage() {
  // Mock ecological data
  const ecosystemTypes = [
    { name: 'Wetlands', area: 12000, health: 75, trend: 'stable' },
    { name: 'Rivers', area: 8500, health: 68, trend: 'declining' },
    { name: 'Lakes', area: 15000, health: 82, trend: 'improving' },
    { name: 'Forests', area: 45000, health: 71, trend: 'stable' },
    { name: 'Grasslands', area: 28000, health: 59, trend: 'declining' }
  ];

  const monthlyFlowRequirements = [85, 90, 120, 150, 180, 200, 220, 210, 190, 160, 130, 100];
  const actualFlow = [80, 85, 115, 145, 175, 195, 210, 200, 180, 155, 125, 95];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const maxFlow = Math.max(...monthlyFlowRequirements);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '↗';
      case 'declining': return '↘';
      default: return '→';
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold text-white">
          4
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Ecological Water Requirements</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-5rem)]">
        {/* Left side - Environmental flow requirements */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Environmental Flow Analysis</h3>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Ecological water use refers to the proportion of water reserved such that the ecological quality structure and functions are maintained.
                </p>
              </div>

              <div className="h-64 relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-3">
                  <span>{maxFlow}</span>
                  <span>{Math.round(maxFlow * 0.75)}</span>
                  <span>{Math.round(maxFlow * 0.5)}</span>
                  <span>{Math.round(maxFlow * 0.25)}</span>
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

                  {/* Chart area */}
                  <svg className="absolute inset-0 w-full h-full">
                    {/* Required flow line */}
                    <polyline
                      points={months.map((month, index) => {
                        const x = (index / (months.length - 1)) * 100;
                        const y = 100 - (monthlyFlowRequirements[index] / maxFlow) * 100;
                        return `${x}% ${y}%`;
                      }).join(' ')}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3"
                      strokeDasharray="5,5"
                    />

                    {/* Actual flow line */}
                    <polyline
                      points={months.map((month, index) => {
                        const x = (index / (months.length - 1)) * 100;
                        const y = 100 - (actualFlow[index] / maxFlow) * 100;
                        return `${x}% ${y}%`;
                      }).join(' ')}
                      fill="none"
                      stroke="#0891b2"
                      strokeWidth="3"
                    />

                    {/* Data points for actual flow */}
                    {months.map((month, index) => {
                      const x = (index / (months.length - 1)) * 100;
                      const y = 100 - (actualFlow[index] / maxFlow) * 100;
                      const deficit = actualFlow[index] < monthlyFlowRequirements[index];
                      return (
                        <circle
                          key={index}
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="4"
                          fill={deficit ? "#ef4444" : "#0891b2"}
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

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-green-600 rounded" style={{
                    backgroundImage: 'repeating-linear-gradient(to right, #059669 0, #059669 5px, transparent 5px, transparent 10px)'
                  }}></div>
                  <span className="text-sm text-gray-700">Required Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-cyan-600 rounded"></div>
                  <span className="text-sm text-gray-700">Actual Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Deficit</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="mb-2"><strong>Why necessary:</strong></p>
              <p>Environmental flows are critical for maintaining ecosystem health, supporting biodiversity,
              and ensuring sustainable water resource management. Adequate flows support fish migration,
              wetland ecosystems, and overall river health.</p>
            </div>
          </div>

          {/* Flow requirements chart */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Available Surface Water (m³/s)</h4>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div>
                  <div className="font-semibold text-green-800">Minimum</div>
                  <div className="text-2xl font-bold text-green-900">85</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-800">Average</div>
                  <div className="text-2xl font-bold text-blue-900">155</div>
                </div>
                <div>
                  <div className="font-semibold text-orange-800">Maximum</div>
                  <div className="text-2xl font-bold text-orange-900">220</div>
                </div>
                <div>
                  <div className="font-semibold text-red-800">Critical</div>
                  <div className="text-2xl font-bold text-red-900">75</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Ecosystem health */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Ecosystem Health Status</h3>

            <div className="space-y-3">
              {ecosystemTypes.map((ecosystem, index) => (
                <div key={ecosystem.name} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{ecosystem.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${getTrendColor(ecosystem.trend)}`}>
                        {getTrendIcon(ecosystem.trend)}
                      </span>
                      <span className="text-sm text-gray-600">{ecosystem.area.toLocaleString()} km²</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            ecosystem.health >= 80 ? 'bg-green-500' :
                            ecosystem.health >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${ecosystem.health}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{ecosystem.health}%</span>
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    Health Index: {ecosystem.health >= 80 ? 'Excellent' :
                                  ecosystem.health >= 60 ? 'Good' : 'Needs Attention'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Species protection */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Species Protection Status</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-800">142</div>
                <div className="text-sm text-green-700">Protected Species</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-800">28</div>
                <div className="text-sm text-yellow-700">Endangered</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-800">85</div>
                <div className="text-sm text-blue-700">Fish Species</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-800">67</div>
                <div className="text-sm text-purple-700">Bird Species</div>
              </div>
            </div>
          </div>

          {/* Conservation measures */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Conservation Measures</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Wetland restoration programs</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Fish ladder construction</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Riparian forest protection</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Water quality monitoring</span>
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 mb-3">Ecological Indicators</h4>
            <div className="text-sm text-indigo-800 space-y-2">
              <div className="flex justify-between">
                <span>Biodiversity Index:</span>
                <span className="font-medium">0.72 (Good)</span>
              </div>
              <div className="flex justify-between">
                <span>Water Quality Index:</span>
                <span className="font-medium">78/100</span>
              </div>
              <div className="flex justify-between">
                <span>Habitat Connectivity:</span>
                <span className="font-medium">65%</span>
              </div>
              <div className="flex justify-between">
                <span>Environmental Flow Met:</span>
                <span className="font-medium">83% of months</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
