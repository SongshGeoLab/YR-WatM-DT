export default function WaterStressPage() {
  // Mock water stress data
  const regions = [
    { name: 'Upper Basin', stress: 25, trend: 'stable', population: 45, availability: 180 },
    { name: 'Middle Basin', stress: 65, trend: 'increasing', population: 180, availability: 120 },
    { name: 'Lower Basin', stress: 85, trend: 'critical', population: 175, availability: 95 },
    { name: 'Tributaries', stress: 45, trend: 'moderate', population: 85, availability: 140 }
  ];

  const stressFactors = [
    { factor: 'Population Growth', impact: 85, priority: 'high' },
    { factor: 'Climate Change', impact: 70, priority: 'high' },
    { factor: 'Industrial Growth', impact: 60, priority: 'medium' },
    { factor: 'Agricultural Demand', impact: 55, priority: 'medium' },
    { factor: 'Water Quality', impact: 45, priority: 'medium' },
    { factor: 'Infrastructure', impact: 35, priority: 'low' }
  ];

  const years = [2020, 2025, 2030, 2035, 2040, 2045, 2050];
  const droughtFrequency = [12, 15, 18, 22, 28, 32, 38];
  const maxDrought = Math.max(...droughtFrequency);

  const getStressColor = (stress: number) => {
    if (stress < 40) return 'bg-green-500';
    if (stress < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStressLevel = (stress: number) => {
    if (stress < 40) return 'Low';
    if (stress < 70) return 'Medium';
    return 'High';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'stable': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'increasing': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 bg-red-50 text-red-800';
      case 'medium': return 'border-yellow-300 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-green-300 bg-green-50 text-green-800';
      default: return 'border-gray-300 bg-gray-50 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center font-bold text-white">
          6
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Water Stress Analysis</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-5rem)]">
        {/* Left side - Regional stress analysis */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Regional Water Stress Assessment</h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-4">
                <p>Water stress occurs when the demand for water exceeds the available amount during a certain period.</p>
                <p className="mt-2">
                  <strong>Assessment criteria:</strong> Water stress ratio = Total demand / Available renewable water resources
                </p>
              </div>

              <div className="space-y-3">
                {regions.map((region, index) => (
                  <div key={region.name} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">{region.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getTrendColor(region.trend)}`}>
                          {region.trend.charAt(0).toUpperCase() + region.trend.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <div className="text-gray-500">Population</div>
                        <div className="font-medium">{region.population}M</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Availability</div>
                        <div className="font-medium">{region.availability} km³</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Stress Level</div>
                        <div className="font-medium">{getStressLevel(region.stress)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${getStressColor(region.stress)}`}
                            style={{ width: `${region.stress}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-bold text-gray-800">{region.stress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Water stress index explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Water Stress Index Categories</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span><strong>Low stress (0-40%):</strong> Sustainable water use</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span><strong>Medium stress (40-70%):</strong> Management needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span><strong>High stress (>70%):</strong> Critical situation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Drought frequency analysis */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Drought Frequency Projections</h4>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="h-32 relative">
                {/* Y-axis */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
                  <span>{maxDrought}</span>
                  <span>{Math.round(maxDrought * 0.5)}</span>
                  <span>0</span>
                </div>

                {/* Chart area */}
                <div className="ml-6 h-full relative">
                  {/* Grid lines */}
                  <div className="absolute w-full h-full">
                    <div className="absolute w-full border-t border-orange-200" style={{ top: '0%' }}></div>
                    <div className="absolute w-full border-t border-orange-200" style={{ top: '50%' }}></div>
                    <div className="absolute w-full border-t border-orange-200" style={{ top: '100%' }}></div>
                  </div>

                  {/* Scatter plot */}
                  <svg className="absolute inset-0 w-full h-full">
                    {years.map((year, index) => {
                      const x = (index / (years.length - 1)) * 100;
                      const y = 100 - (droughtFrequency[index] / maxDrought) * 100;
                      return (
                        <g key={year}>
                          <circle
                            cx={`${x}%`}
                            cy={`${y}%`}
                            r={droughtFrequency[index] / 6}
                            fill="#ea580c"
                            fillOpacity="0.6"
                          />
                          <text
                            x={`${x}%`}
                            y={`${y + 15}%`}
                            textAnchor="middle"
                            className="text-xs fill-orange-800"
                          >
                            {droughtFrequency[index]}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* X-axis labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
                    {years.map((year) => (
                      <span key={year}>{year}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-orange-800 mt-2">
                Projected drought events per decade (circle size = severity)
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Stress factors and impacts */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Water Stress Contributing Factors</h3>

            <div className="space-y-3">
              {stressFactors.map((item, index) => (
                <div key={item.factor} className={`border rounded-lg p-4 ${getPriorityColor(item.priority)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{item.factor}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/50">
                      {item.priority} priority
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="w-full bg-white/50 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.priority === 'high' ? 'bg-red-600' :
                            item.priority === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                          }`}
                          style={{ width: `${item.impact}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-semibold">{item.impact}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Future projections */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">2050 Projections</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-800">75%</div>
                <div className="text-sm text-red-700">Overall stress</div>
                <div className="text-xs text-red-600">Basin average</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-800">3.2x</div>
                <div className="text-sm text-orange-700">Higher drought</div>
                <div className="text-xs text-orange-600">vs. baseline</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-800">28%</div>
                <div className="text-sm text-yellow-700">Demand increase</div>
                <div className="text-xs text-yellow-600">2020-2050</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-800">15%</div>
                <div className="text-sm text-blue-700">Supply reduction</div>
                <div className="text-xs text-blue-600">Climate impact</div>
              </div>
            </div>
          </div>

          {/* Risk assessment */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Risk Assessment Matrix</h4>
            <div className="grid grid-cols-3 grid-rows-3 gap-1 h-32">
              {/* High probability, high impact */}
              <div className="bg-red-200 rounded flex items-center justify-center text-xs font-medium">
                <span className="transform -rotate-45">Extreme drought</span>
              </div>
              <div className="bg-red-100 rounded flex items-center justify-center text-xs">
                <span className="transform -rotate-45">Urban shortage</span>
              </div>
              <div className="bg-yellow-100 rounded flex items-center justify-center text-xs">
                <span className="transform -rotate-45">Crop failure</span>
              </div>

              {/* Medium probability */}
              <div className="bg-orange-100 rounded flex items-center justify-center text-xs">
                <span className="transform -rotate-45">Industrial cuts</span>
              </div>
              <div className="bg-yellow-100 rounded flex items-center justify-center text-xs">
                <span className="transform -rotate-45">Ecosystem stress</span>
              </div>
              <div className="bg-green-100 rounded flex items-center justify-center text-xs">
                <span className="transform -rotate-45">Quality issues</span>
              </div>

              {/* Low probability */}
              <div className="bg-green-100 rounded flex items-center justify-center text-xs">
                <span className="transform -rotate-45">Minor shortage</span>
              </div>
              <div className="bg-green-200 rounded flex items-center justify-center text-xs">
                <span className="transform -rotate-45">Efficiency gains</span>
              </div>
              <div className="bg-green-200 rounded flex items-center justify-center text-xs">
                <span className="transform -rotate-45">Normal conditions</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <span>Low Impact ←</span>
              <span>→ High Impact</span>
            </div>
          </div>

          {/* Action recommendations */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 mb-3">Recommended Actions</h4>
            <div className="text-sm text-indigo-800 space-y-2">
              <div>• Implement water conservation programs</div>
              <div>• Develop drought-resistant crops</div>
              <div>• Improve irrigation efficiency</div>
              <div>• Build strategic water reserves</div>
              <div>• Enhance early warning systems</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
