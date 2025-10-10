export default function WaterAvailabilityPage() {
  // Mock data for climate scenarios
  const scenarios = ['RCP2.6', 'RCP4.5', 'RCP8.5'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const waterAvailabilityData = {
    'RCP2.6': [120, 115, 130, 145, 180, 220, 280, 290, 240, 190, 150, 125],
    'RCP4.5': [115, 110, 125, 140, 170, 210, 270, 285, 235, 185, 145, 120],
    'RCP8.5': [110, 105, 115, 130, 155, 190, 250, 270, 220, 170, 135, 115]
  };

  const colors = {
    'RCP2.6': '#10b981', // green
    'RCP4.5': '#f59e0b', // amber
    'RCP8.5': '#ef4444'  // red
  };

  const maxValue = Math.max(...Object.values(waterAvailabilityData).flat());

  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-white">
          2
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Surface Water Availability</h2>
      </div>

      <div className="space-y-6">
        {/* Climate Scenario Indicator */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-lg font-medium text-gray-700">What is the RCP climate scenario?</span>
          <div className="flex gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-red-400"></div>
            <div className="w-4 h-4 rounded-full bg-amber-400"></div>
            <div className="w-4 h-4 rounded-full border-2 border-green-400"></div>
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Water Availability by Climate Scenario</h3>

          {/* Chart Area */}
          <div className="bg-white rounded-lg p-6 mb-4">
            <div className="h-80 relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-3">
                <span>{maxValue}</span>
                <span>{Math.round(maxValue * 0.75)}</span>
                <span>{Math.round(maxValue * 0.5)}</span>
                <span>{Math.round(maxValue * 0.25)}</span>
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

                {/* Data lines */}
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 10 }}>
                  {scenarios.map((scenario, scenarioIndex) => {
                    const points = waterAvailabilityData[scenario].map((value, monthIndex) => ({
                      x: (monthIndex / (months.length - 1)) * 100,
                      y: 100 - (value / maxValue) * 100
                    }));

                    const pathData = points.reduce((acc, point, index) => {
                      const command = index === 0 ? 'M' : 'L';
                      return `${acc} ${command} ${point.x}% ${point.y}%`;
                    }, '');

                    return (
                      <g key={scenario}>
                        <path
                          d={pathData}
                          fill="none"
                          stroke={colors[scenario]}
                          strokeWidth="3"
                          className="drop-shadow-sm"
                        />
                        {/* Data points */}
                        {points.map((point, index) => (
                          <circle
                            key={index}
                            cx={`${point.x}%`}
                            cy={`${point.y}%`}
                            r="4"
                            fill={colors[scenario]}
                            className="drop-shadow-sm"
                          />
                        ))}
                      </g>
                    );
                  })}
                </svg>

                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
                  {months.map((month, index) => (
                    <span key={month} className="transform -translate-x-1/2" style={{ marginLeft: index === 0 ? '0' : '0' }}>
                      {month}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            {scenarios.map(scenario => (
              <div key={scenario} className="flex items-center gap-2">
                <div
                  className="w-4 h-1 rounded"
                  style={{ backgroundColor: colors[scenario] }}
                />
                <span className="text-sm font-medium text-gray-700">{scenario}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Climate Scenarios Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h4 className="font-semibold text-green-900">RCP2.6</h4>
            </div>
            <div className="text-sm text-green-800 space-y-1">
              <div>• Strong mitigation scenario</div>
              <div>• Global warming limited to 1.5°C</div>
              <div>• Higher water availability</div>
              <div>• Best-case climate outcome</div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <h4 className="font-semibold text-amber-900">RCP4.5</h4>
            </div>
            <div className="text-sm text-amber-800 space-y-1">
              <div>• Moderate mitigation scenario</div>
              <div>• Global warming ~2.4°C by 2100</div>
              <div>• Moderate water stress</div>
              <div>• Intermediate climate outcome</div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <h4 className="font-semibold text-red-900">RCP8.5</h4>
            </div>
            <div className="text-sm text-red-800 space-y-1">
              <div>• High emission scenario</div>
              <div>• Global warming ~4.9°C by 2100</div>
              <div>• Severe water stress</div>
              <div>• Business-as-usual outcome</div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">Climate Scenarios Caption</h4>
          <p className="text-sm text-blue-800">
            Representative Concentration Pathways (RCPs) represent different greenhouse gas concentration trajectories.
            The analysis shows projected surface water availability (km³/month) under three climate scenarios for the
            Yangtze River Basin through 2100. Higher emission scenarios generally result in reduced water availability
            during critical months, with the most significant impacts during the traditional dry season (Oct-Mar).
          </p>
        </div>
      </div>
    </div>
  );
}
