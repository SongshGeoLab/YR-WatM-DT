export default function AgriculturePage() {
  // Mock agricultural and industrial data
  const cropTypes = [
    { name: 'Rice', waterIntensity: 1.2, area: 45, production: 180, efficiency: 75 },
    { name: 'Wheat', waterIntensity: 0.8, area: 30, production: 120, efficiency: 82 },
    { name: 'Corn', waterIntensity: 0.6, area: 25, production: 150, efficiency: 78 },
    { name: 'Soybeans', waterIntensity: 0.9, area: 15, production: 45, efficiency: 71 },
    { name: 'Cotton', waterIntensity: 2.1, area: 10, production: 8, efficiency: 65 }
  ];

  const industrialSectors = [
    { name: 'Steel', waterDemand: 45, recycling: 60, growth: 2.1 },
    { name: 'Chemical', waterDemand: 38, recycling: 45, growth: 3.2 },
    { name: 'Textile', waterDemand: 25, recycling: 35, growth: 1.8 },
    { name: 'Power', waterDemand: 120, recycling: 85, growth: 1.5 },
    { name: 'Food Processing', waterDemand: 15, recycling: 25, growth: 2.8 }
  ];

  const years = [2020, 2025, 2030, 2035, 2040];
  const waterDemandTrends = {
    irrigation: [85, 88, 90, 92, 94],
    industrial: [35, 38, 42, 45, 48],
    total: [120, 126, 132, 137, 142]
  };

  const maxDemand = Math.max(...waterDemandTrends.total);

  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white">
          5
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Agriculture and Industry</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-5rem)]">
        {/* Left side - Agricultural analysis */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Water-using Ratio Analysis</h3>

            {/* Water demand treemap visualization */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-700 mb-3">Crop Water Intensity & Production</h4>
              <div className="grid grid-cols-4 grid-rows-3 gap-1 h-48">
                {cropTypes.map((crop, index) => {
                  const size = Math.max(1, Math.floor((crop.area / 50) * 12));
                  const colors = ['bg-green-400', 'bg-yellow-400', 'bg-orange-400', 'bg-red-400', 'bg-pink-400'];

                  return (
                    <div
                      key={crop.name}
                      className={`${colors[index]} rounded p-2 flex flex-col justify-between text-white text-xs`}
                      style={{
                        gridColumn: `span ${Math.min(size, 4)}`,
                        gridRow: `span ${Math.ceil(size / 4)}`
                      }}
                    >
                      <div className="font-semibold">{crop.name}</div>
                      <div>
                        <div>{crop.waterIntensity}x intensity</div>
                        <div>{crop.area}M hectares</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Crop efficiency metrics */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Irrigation Water Demand vs Production Water Demand</h4>
              {cropTypes.map((crop, index) => (
                <div key={crop.name} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{crop.name}</span>
                    <div className="text-sm text-gray-600">
                      {crop.waterIntensity} m³/kg • {crop.production}M tons
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${crop.efficiency}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {crop.efficiency}% efficiency
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Energy generation section */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Energy Generation</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-800">186</div>
                  <div className="text-sm text-blue-700">TWh/year</div>
                  <div className="text-xs text-blue-600">Hydroelectric</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-800">12.8</div>
                  <div className="text-sm text-orange-700">m³/kWh</div>
                  <div className="text-xs text-orange-600">Water intensity</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Industrial analysis */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Industrial Water Use Trends</h3>

            {/* Water demand projection chart */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="h-48 relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-3">
                  <span>{maxDemand}</span>
                  <span>{Math.round(maxDemand * 0.75)}</span>
                  <span>{Math.round(maxDemand * 0.5)}</span>
                  <span>{Math.round(maxDemand * 0.25)}</span>
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

                  {/* Stacked area chart */}
                  <svg className="absolute inset-0 w-full h-full">
                    {/* Industrial demand (bottom) */}
                    <polygon
                      points={years.map((year, index) => {
                        const x = (index / (years.length - 1)) * 100;
                        const y = 100 - (waterDemandTrends.industrial[index] / maxDemand) * 100;
                        return `${x}% ${y}%`;
                      }).join(' ') + ` 100% 100% 0% 100%`}
                      fill="#f59e0b"
                      fillOpacity="0.7"
                    />

                    {/* Irrigation demand (top) */}
                    <polygon
                      points={years.map((year, index) => {
                        const x = (index / (years.length - 1)) * 100;
                        const yIndustrial = 100 - (waterDemandTrends.industrial[index] / maxDemand) * 100;
                        const yTotal = 100 - (waterDemandTrends.total[index] / maxDemand) * 100;
                        return `${x}% ${yTotal}%`;
                      }).join(' ') + ' ' + years.map((year, index) => {
                        const x = (index / (years.length - 1)) * 100;
                        const yIndustrial = 100 - (waterDemandTrends.industrial[index] / maxDemand) * 100;
                        return `${x}% ${yIndustrial}%`;
                      }).reverse().join(' ')}
                      fill="#10b981"
                      fillOpacity="0.7"
                    />

                    {/* Total demand line */}
                    <polyline
                      points={years.map((year, index) => {
                        const x = (index / (years.length - 1)) * 100;
                        const y = 100 - (waterDemandTrends.total[index] / maxDemand) * 100;
                        return `${x}% ${y}%`;
                      }).join(' ')}
                      fill="none"
                      stroke="#1f2937"
                      strokeWidth="2"
                    />
                  </svg>

                  {/* X-axis labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
                    {years.map((year) => (
                      <span key={year}>{year}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-green-500 opacity-70 rounded"></div>
                  <span className="text-sm text-gray-700">Irrigation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-amber-500 opacity-70 rounded"></div>
                  <span className="text-sm text-gray-700">Industrial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-gray-800 rounded"></div>
                  <span className="text-sm text-gray-700">Total Demand (km³/year)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Industrial sectors breakdown */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Industrial Sectors Water Use</h4>
            <div className="space-y-3">
              {industrialSectors.map((sector, index) => (
                <div key={sector.name} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{sector.name}</span>
                    <div className="text-sm text-gray-600">
                      {sector.waterDemand} km³/year • +{sector.growth}% growth
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Water Demand</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(sector.waterDemand / 120) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Recycling Rate</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${sector.recycling}%` }}
                        />
                      </div>
                      <div className="text-xs text-green-600 mt-1">{sector.recycling}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Efficiency metrics */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Efficiency Improvements</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-800">15%</div>
                <div className="text-sm text-green-700">Water savings</div>
                <div className="text-xs text-green-600">2020-2030</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-800">68%</div>
                <div className="text-sm text-blue-700">Recycling rate</div>
                <div className="text-xs text-blue-600">Target 2030</div>
              </div>
            </div>
          </div>

          {/* Key insights */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-3">Key Insights</h4>
            <div className="text-sm text-purple-800 space-y-1">
              <div>• Rice cultivation most water-intensive crop</div>
              <div>• Industrial recycling rates vary significantly</div>
              <div>• Irrigation efficiency improvements needed</div>
              <div>• Power sector largest industrial water user</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
