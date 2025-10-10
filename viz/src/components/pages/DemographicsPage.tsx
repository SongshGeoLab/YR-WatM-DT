export default function DemographicsPage() {
  // Mock demographic data
  const years = [2020, 2025, 2030, 2035, 2040, 2045, 2050, 2055, 2060];
  const populationData = {
    total: [400, 405, 408, 410, 411, 410, 408, 405, 400],
    urban: [280, 295, 310, 325, 335, 340, 342, 340, 335],
    rural: [120, 110, 98, 85, 76, 70, 66, 65, 65]
  };

  const fertilityData = [85, 82, 78, 75, 72, 70, 68, 67, 66];
  const waterConsumption = [180, 185, 190, 195, 200, 205, 210, 212, 215];

  const maxPopulation = Math.max(...populationData.total);
  const maxConsumption = Math.max(...waterConsumption);

  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center font-bold text-white">
          3
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Demography and Domestic Water Usage</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-5rem)]">
        {/* Left side - Population projections */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Population Projections (2020-2060)</h3>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="h-64 relative">
                {/* Chart area */}
                <div className="h-full relative">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-3">
                    <span>{maxPopulation}M</span>
                    <span>{Math.round(maxPopulation * 0.75)}M</span>
                    <span>{Math.round(maxPopulation * 0.5)}M</span>
                    <span>{Math.round(maxPopulation * 0.25)}M</span>
                    <span>0M</span>
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
                      {/* Rural population (bottom) */}
                      <polygon
                        points={years.map((year, index) => {
                          const x = (index / (years.length - 1)) * 100;
                          const y = 100 - (populationData.rural[index] / maxPopulation) * 100;
                          return `${x}% ${y}%`;
                        }).join(' ') + ` 100% 100% 0% 100%`}
                        fill="#3b82f6"
                        fillOpacity="0.7"
                      />

                      {/* Urban population (top) */}
                      <polygon
                        points={years.map((year, index) => {
                          const x = (index / (years.length - 1)) * 100;
                          const yRural = 100 - (populationData.rural[index] / maxPopulation) * 100;
                          const yTotal = 100 - (populationData.total[index] / maxPopulation) * 100;
                          return `${x}% ${yTotal}%`;
                        }).join(' ') + ' ' + years.map((year, index) => {
                          const x = (index / (years.length - 1)) * 100;
                          const yRural = 100 - (populationData.rural[index] / maxPopulation) * 100;
                          return `${x}% ${yRural}%`;
                        }).reverse().join(' ')}
                        fill="#8b5cf6"
                        fillOpacity="0.7"
                      />

                      {/* Total population line */}
                      <polyline
                        points={years.map((year, index) => {
                          const x = (index / (years.length - 1)) * 100;
                          const y = 100 - (populationData.total[index] / maxPopulation) * 100;
                          return `${x}% ${y}%`;
                        }).join(' ')}
                        fill="none"
                        stroke="#1f2937"
                        strokeWidth="2"
                      />
                    </svg>

                    {/* X-axis labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
                      {years.map((year, index) => (
                        <span key={year} className={`${index % 2 === 0 ? '' : 'opacity-60'}`}>
                          {index % 2 === 0 ? year : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-purple-500 opacity-70 rounded"></div>
                  <span className="text-sm text-gray-700">Urban Population</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-blue-500 opacity-70 rounded"></div>
                  <span className="text-sm text-gray-700">Rural Population</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-gray-800 rounded"></div>
                  <span className="text-sm text-gray-700">Total Population</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fertility Rate Chart */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Birth Rate Trends</h4>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="h-32 flex items-end justify-center gap-2">
                {fertilityData.map((rate, index) => (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <div
                      className="bg-orange-500 rounded transition-all hover:bg-orange-600"
                      style={{
                        width: '16px',
                        height: `${(rate / Math.max(...fertilityData)) * 100}px`,
                        minHeight: '8px'
                      }}
                    />
                    <span className="text-xs text-gray-600">
                      {index % 2 === 0 ? years[index] : ''}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-center text-sm text-orange-800 mt-2">
                Births per 1,000 people per year
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Water consumption and demographics */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Water Consumption Trends</h3>

            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <div className="h-64 relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-3">
                  <span>{maxConsumption}</span>
                  <span>{Math.round(maxConsumption * 0.75)}</span>
                  <span>{Math.round(maxConsumption * 0.5)}</span>
                  <span>{Math.round(maxConsumption * 0.25)}</span>
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

                  {/* Water consumption line */}
                  <svg className="absolute inset-0 w-full h-full">
                    <polyline
                      points={years.map((year, index) => {
                        const x = (index / (years.length - 1)) * 100;
                        const y = 100 - (waterConsumption[index] / maxConsumption) * 100;
                        return `${x}% ${y}%`;
                      }).join(' ')}
                      fill="none"
                      stroke="#0891b2"
                      strokeWidth="3"
                    />

                    {/* Data points */}
                    {years.map((year, index) => {
                      const x = (index / (years.length - 1)) * 100;
                      const y = 100 - (waterConsumption[index] / maxConsumption) * 100;
                      return (
                        <circle
                          key={index}
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="4"
                          fill="#0891b2"
                        />
                      );
                    })}
                  </svg>

                  {/* X-axis labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
                    {years.map((year, index) => (
                      <span key={year} className={`${index % 2 === 0 ? '' : 'opacity-60'}`}>
                        {index % 2 === 0 ? year : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-cyan-800 mt-2">
                Domestic Water Consumption (Liters per capita per day)
              </div>
            </div>
          </div>

          {/* Demographic indicators */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Key Demographic Indicators</h4>

            <div className="grid grid-cols-1 gap-3">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Population Density</span>
                  <span className="text-lg font-bold text-gray-900">220 people/km²</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Urbanization Rate</span>
                  <span className="text-lg font-bold text-gray-900">83%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '83%' }}></div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Average Household Size</span>
                  <span className="text-lg font-bold text-gray-900">2.8 people</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '56%' }}></div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Aging Index (60+)</span>
                  <span className="text-lg font-bold text-gray-900">28%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '28%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Insight box */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 mb-2">Key Insights</h4>
            <div className="text-sm text-indigo-800 space-y-1">
              <div>• Population peak expected around 2040</div>
              <div>• Continuing urbanization increases water demand</div>
              <div>• Aging population affects consumption patterns</div>
              <div>• Per capita water use steadily increasing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
