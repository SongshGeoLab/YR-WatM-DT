import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/api';

export default function DemographicsPage() {
  // Parameter states
  const [fertilityValue, setFertilityValue] = useState<number>(1.7);
  const [dietValue, setDietValue] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states - keep structure compatible with existing SVG charts
  const [years, setYears] = useState<number[]>([2020, 2025, 2030, 2035, 2040, 2045, 2050, 2055, 2060]);
  const [populationData, setPopulationData] = useState({
    total: [400, 405, 408, 410, 411, 410, 408, 405, 400],
    urban: [280, 295, 310, 325, 335, 340, 342, 340, 335],
    rural: [120, 110, 98, 85, 76, 70, 66, 65, 65]
  });
  const [fertilityData, setFertilityData] = useState([85, 82, 78, 75, 72, 70, 68, 67, 66]);
  const [waterConsumption, setWaterConsumption] = useState([180, 185, 190, 195, 200, 205, 210, 212, 215]);

  const maxPopulation = Math.max(...populationData.total);
  const maxConsumption = Math.max(...waterConsumption);

  // Load data from backend
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[Demographics] Loading data for fertility:', fertilityValue, 'diet:', dietValue);

      const params = await api.getParams();
      console.log('[Demographics] Got params:', Object.keys(params));

      // Build parameter values
      const values: api.ParameterValues = {
        "Fertility Variation": fertilityValue,
        "Diet change scenario switch": dietValue,
        "water-saving irrigation efficiency ratio": params["water-saving irrigation efficiency ratio"][1],
        "fire generation share province target": params["fire generation share province target"][1],
        "Ecological water flow variable": params["Ecological water flow variable"][1],
        "Climate change scenario switch for water yield": params["Climate change scenario switch for water yield"][1]
      };

      console.log('[Demographics] Resolving scenario with values:', values);
      const result = await api.resolveScenario(values);
      const scenario_name = result.scenario_name;
      console.log('[Demographics] Resolved scenario:', scenario_name);

      // Fetch population and water data (2020-2060, every 5 years = 9 data points)
      console.log('[Demographics] Fetching population data...');
      const popSeries = await api.getSeries('total_population', scenario_name, { start_step: 624, end_step: 1264 });
      console.log('[Demographics] Population data points:', popSeries.series.time.length);

      console.log('[Demographics] Fetching water data...');
      const waterSeries = await api.getSeries('domestic_water_demand_province_sum', scenario_name, { start_step: 624, end_step: 1264 });
      console.log('[Demographics] Water data points:', waterSeries.series.time.length);

      // Sample data every 5 years for display
      const timeArray = popSeries.series.time;
      const popArray = popSeries.series.value;
      const waterArray = waterSeries.series.value;

      // Sample indices for years: 2020, 2025, 2030, ..., 2060 (9 points)
      const sampledYears: number[] = [];
      const sampledPop: number[] = [];
      const sampledWater: number[] = [];

      for (let year = 2020; year <= 2060; year += 5) {
        const idx = timeArray.findIndex(t => Math.abs(t - year) < 0.5);
        if (idx >= 0) {
          sampledYears.push(Math.round(timeArray[idx]));
          sampledPop.push(popArray[idx] / 1e6); // Convert to millions
          sampledWater.push(waterArray[idx] / 1e9); // Convert to billions for display
        } else {
          // If exact match not found, use closest value
          const closestIdx = timeArray.reduce((closest, t, i) =>
            Math.abs(t - year) < Math.abs(timeArray[closest] - year) ? i : closest, 0);
          sampledYears.push(year);
          sampledPop.push(popArray[closestIdx] / 1e6);
          sampledWater.push(waterArray[closestIdx] / 1e9);
        }
      }

      console.log('[Demographics] Sampled data:', { sampledYears, sampledPop, sampledWater });

      setYears(sampledYears);
      setPopulationData({
        total: sampledPop,
        urban: sampledPop.map(v => v * 0.7), // Assume 70% urban (placeholder)
        rural: sampledPop.map(v => v * 0.3)  // Assume 30% rural (placeholder)
      });
      setWaterConsumption(sampledWater.map(v => v * 100)); // Scale for display

      console.log('[Demographics] Data loaded successfully!');

    } catch (err: any) {
      console.error('[Demographics] Failed to load data:', err);
      setError(err.message || 'Failed to load data from backend');
      // Keep using mock data on error - ensure charts still display
      console.log('[Demographics] Using mock data due to error');

      // Ensure we have valid data for charts
      setYears([2020, 2025, 2030, 2035, 2040, 2045, 2050, 2055, 2060]);
      setPopulationData({
        total: [400, 405, 408, 410, 411, 410, 408, 405, 400],
        urban: [280, 295, 310, 325, 335, 340, 342, 340, 335],
        rural: [120, 110, 98, 85, 76, 70, 66, 65, 65]
      });
      setWaterConsumption([180, 185, 190, 195, 200, 205, 210, 212, 215]);
    } finally {
      setLoading(false);
    }
  }, [fertilityValue, dietValue]);

  useEffect(() => {
    loadData();
  }, [fertilityValue, dietValue]);

  // Debug: Log current data state
  useEffect(() => {
    console.log('[Demographics] Current data state:', {
      years,
      populationData,
      waterConsumption,
      maxPopulation,
      maxConsumption
    });
  }, [years, populationData, waterConsumption, maxPopulation, maxConsumption]);

  // Available parameter values
  const fertilityValues = [1.6, 1.65, 1.7, 1.75, 1.8];
  const dietValues = [1, 2, 3];
  const dietLabels = { 1: 'Traditional', 2: 'Transitional', 3: 'Modern' };

  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center font-bold text-white">
          3
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Demography and Domestic Water Usage</h2>
      </div>

      {/* Parameter Controls */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fertility Slider */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Fertility Rate: {fertilityValue.toFixed(2)}
            </label>
            <input
              type="range"
              min={1.6}
              max={1.8}
              step={0.05}
              value={fertilityValue}
              onChange={(e) => setFertilityValue(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              disabled={loading}
            />
            <div className="flex gap-1 mt-2">
              {fertilityValues.map((val) => (
                <button
                  key={val}
                  onClick={() => setFertilityValue(val)}
                  disabled={loading}
                  className={`px-2 py-1 text-xs rounded ${
                    Math.abs(fertilityValue - val) < 0.01
                      ? 'bg-purple-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Diet Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Diet Scenario: {dietLabels[dietValue as keyof typeof dietLabels]}
            </label>
            <div className="flex gap-2 mt-[0.7rem]">
              {dietValues.map((val) => (
                <button
                  key={val}
                  onClick={() => setDietValue(val)}
                  disabled={loading}
                  className={`flex-1 px-3 py-2 text-sm rounded ${
                    dietValue === val
                      ? 'bg-purple-500 text-white font-medium'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {val}. {dietLabels[val as keyof typeof dietLabels]}
                </button>
              ))}
            </div>
          </div>
        </div>
        {loading && (
          <div className="text-center text-sm text-gray-500 mt-2">Loading data...</div>
        )}
        {error && (
          <div className="text-center text-sm text-red-500 mt-2">
            Error: {error} (Using mock data)
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-14rem)]">
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
