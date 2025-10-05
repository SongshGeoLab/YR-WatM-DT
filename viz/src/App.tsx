import { useState } from 'react';
import { PlotlyChart } from './components/charts/PlotlyChart';
import { WaterAvailabilityPageWorking } from './components/WaterAvailabilityPageWorking';
import { DemographyPageWorking } from './components/DemographyPageWorking';

// Simple page components to avoid webpack issues
function StudyAreaPage() {
  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
          1
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Description of the Study Area</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100%-5rem)]">
        {/* Left side - Text description */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Yangtze River Basin Overview</h3>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                The Yangtze River Basin is the largest river system in China and the third-longest river in the world.
                Covering approximately 1.8 million km², it drains about one-fifth of China's total land area.
              </p>
              <p>
                The basin supports over 400 million people and is crucial for China's economic development,
                providing water resources for agriculture, industry, and domestic use across multiple provinces.
              </p>
            </div>
          </div>

          {/* Key Statistics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Key Basin Statistics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Length:</span>
                  <span className="font-medium">6,300 km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Drainage Area:</span>
                  <span className="font-medium">1.8M km²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Discharge:</span>
                  <span className="font-medium">31,900 m³/s</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Population:</span>
                  <span className="font-medium">~400M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Major Dams:</span>
                  <span className="font-medium">50,000+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GDP Contribution:</span>
                  <span className="font-medium">~42%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Static Map */}
        <div className="flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Interactive Basin Map</h3>
            <p className="text-sm text-gray-600">
              Explore the Yangtze River Basin with monitoring stations, major cities, and watershed boundaries.
            </p>
          </div>

          <div className="flex-1 min-h-[400px] relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-blue-50">
            {/* Static map representation */}
            <div className="w-full h-full cursor-pointer relative bg-gradient-to-br from-blue-100 to-green-100">
              {/* River representation */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
                {/* Yangtze River main channel */}
                <path
                  d="M50 150 Q120 140 200 145 Q280 150 350 155"
                  stroke="#2563eb"
                  strokeWidth="4"
                  fill="none"
                  opacity="0.8"
                />

                {/* Major cities */}
                <circle cx="320" cy="160" r="6" fill="#dc2626" opacity="0.8" />
                <text x="330" y="165" fontSize="10" fill="#dc2626" fontWeight="bold">Shanghai</text>

                <circle cx="220" cy="150" r="5" fill="#059669" opacity="0.8" />
                <text x="230" y="155" fontSize="10" fill="#059669" fontWeight="bold">Wuhan</text>

                <circle cx="140" cy="165" r="5" fill="#7c3aed" opacity="0.8" />
                <text x="150" y="170" fontSize="10" fill="#7c3aed" fontWeight="bold">Chongqing</text>
              </svg>
            </div>

            {/* Map overlay info */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
              <h4 className="font-semibold text-sm mb-2">Yangtze River Basin</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• Total Area: ~1.8M km²</div>
                <div>• Length: ~6,300 km</div>
                <div>• Population: ~400M people</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaterAvailabilityPage() {
  const scenarios = ['RCP2.6', 'RCP4.5', 'RCP8.5'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const colors = { 'RCP2.6': '#10b981', 'RCP4.5': '#f59e0b', 'RCP8.5': '#ef4444' };

  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-white">
          2
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Surface Water Availability</h2>
      </div>

      <div className="space-y-6">
        <PlotlyChart
          id="monthly-water-availability"
          title="Monthly Water Availability by Climate Scenario"
          description="RCP scenarios impact on seasonal water resources"
          height="400px"
          className="mb-6"
        />

        <PlotlyChart
          id="climate-projections"
          title="Long-term Climate Projections"
          description="Temperature and precipitation trends under different scenarios"
          height="350px"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">RCP2.6</h4>
            <div className="text-sm text-green-800">Strong mitigation scenario</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 mb-2">RCP4.5</h4>
            <div className="text-sm text-amber-800">Moderate mitigation scenario</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">RCP8.5</h4>
            <div className="text-sm text-red-800">High emission scenario</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemographicsPage() {
  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center font-bold text-white">
          3
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Demography and Domestic Water Usage</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <PlotlyChart
            id="population-projections"
            title="Population Projections (2020-2060)"
            description="Demographic trends and population forecasts"
            height="250px"
          />

          <PlotlyChart
            id="water-demand-demographics"
            title="Domestic Water Demand"
            description="Per capita water consumption patterns"
            height="250px"
          />
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Key Demographic Indicators</h3>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EcologicalWaterPage() {
  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold text-white">
          4
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Ecological Water Requirements</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-5rem)]">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-green-900 mb-4">Environmental Flow Components</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-2xl font-bold text-green-700">65%</div>
                <div className="text-sm text-green-600">Base Flow</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-2xl font-bold text-green-700">25%</div>
                <div className="text-sm text-green-600">High Flow Pulses</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-2xl font-bold text-green-700">8%</div>
                <div className="text-sm text-green-600">Small Floods</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-2xl font-bold text-green-700">2%</div>
                <div className="text-sm text-green-600">Large Floods</div>
              </div>
            </div>
          </div>

          <PlotlyChart
            id="ecological-flow-trend"
            title="Monthly Ecological Flow Requirements"
            description="Environmental flow needs throughout the year"
            height="300px"
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <PlotlyChart
            id="ecosystem-health"
            title="Ecosystem Health Indicators"
            description="Biodiversity and habitat quality metrics"
            height="350px"
          />

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Key Species Protection Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Yangtze Finless Porpoise</span>
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Critically Endangered</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Chinese Sturgeon</span>
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Critically Endangered</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Chinese Paddlefish</span>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">Extinct</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgriculturePage() {
  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white">
          5
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Agriculture and Industry</h2>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PlotlyChart
              id="water-use-sectors"
              title="Water Use by Sector (2020-2030)"
              description="Agricultural, industrial, and domestic water consumption trends"
              height="400px"
            />
          </div>

          <div className="space-y-4">
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-3">Agricultural Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-orange-700">Irrigated Area:</span>
                  <span className="font-medium">24.7M hectares</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Rice Production:</span>
                  <span className="font-medium">60% of national</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Water Efficiency:</span>
                  <span className="font-medium">0.52 kg/m³</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Industrial Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Steel Production:</span>
                  <span className="font-medium">50% of national</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">GDP Contribution:</span>
                  <span className="font-medium">42% of national</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Water Recycling:</span>
                  <span className="font-medium">78% average</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlotlyChart
            id="irrigation-efficiency"
            title="Irrigation Efficiency Trends"
            description="Water use efficiency in agricultural regions"
            height="300px"
          />

          <PlotlyChart
            id="industrial-water-recycling"
            title="Industrial Water Recycling Rates"
            description="Water reuse and recycling in major industrial zones"
            height="300px"
          />
        </div>
      </div>
    </div>
  );
}

function WaterStressPage() {
  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center font-bold text-white">
          6
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Water Stress Analysis</h2>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-700">2.1</div>
            <div className="text-sm text-red-600">Water Stress Index</div>
            <div className="text-xs text-red-500 mt-1">High Stress</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-700">68%</div>
            <div className="text-sm text-orange-600">Demand/Supply Ratio</div>
            <div className="text-xs text-orange-500 mt-1">Moderate Stress</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-700">35</div>
            <div className="text-sm text-yellow-600">Drought Days/Year</div>
            <div className="text-xs text-yellow-500 mt-1">Average</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-700">82%</div>
            <div className="text-sm text-blue-600">Water Security Index</div>
            <div className="text-xs text-blue-500 mt-1">Good</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlotlyChart
            id="water-stress-map"
            title="Regional Water Stress Distribution"
            description="Spatial analysis of water stress across basin regions"
            height="400px"
          />

          <PlotlyChart
            id="drought-risk"
            title="Drought Risk Assessment"
            description="Historical and projected drought patterns"
            height="400px"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlotlyChart
            id="vulnerability-index"
            title="Climate Vulnerability Index"
            description="Vulnerability to climate change impacts"
            height="300px"
          />

          <PlotlyChart
            id="adaptation-measures"
            title="Adaptation Measure Effectiveness"
            description="Performance of water stress mitigation strategies"
            height="300px"
          />
        </div>
      </div>
    </div>
  );
}

function WaterQualityPage() {
  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white">
          7
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Water Quality and Sediment Analysis</h2>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-lg font-bold text-green-700">Grade I-II</div>
            <div className="text-xs text-green-600">32% of stations</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-700">Grade III</div>
            <div className="text-xs text-blue-600">45% of stations</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-lg font-bold text-yellow-700">Grade IV</div>
            <div className="text-xs text-yellow-600">15% of stations</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-lg font-bold text-orange-700">Grade V</div>
            <div className="text-xs text-orange-600">6% of stations</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-lg font-bold text-red-700">Below V</div>
            <div className="text-xs text-red-600">2% of stations</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlotlyChart
            id="water-quality-trend"
            title="Water Quality Trends (2010-2024)"
            description="Temporal changes in water quality indicators"
            height="350px"
          />

          <PlotlyChart
            id="pollutant-sources"
            title="Major Pollutant Sources"
            description="Point and non-point source pollution analysis"
            height="350px"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PlotlyChart
            id="sediment-transport"
            title="Sediment Transport Patterns"
            description="Seasonal sediment load variations"
            height="300px"
          />

          <PlotlyChart
            id="nutrient-levels"
            title="Nutrient Pollution Levels"
            description="Nitrogen and phosphorus concentrations"
            height="300px"
          />

          <PlotlyChart
            id="heavy-metals"
            title="Heavy Metal Contamination"
            description="Trace metal pollution monitoring"
            height="300px"
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Water Quality Monitoring Network</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">1,247</div>
              <div className="text-gray-600">Monitoring Stations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">24</div>
              <div className="text-gray-600">Key Parameters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">365</div>
              <div className="text-gray-600">Days/Year Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">98.5%</div>
              <div className="text-gray-600">Data Completeness</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    'Study Area',
    'Water Availability',
    'Demographics',
    'Ecological Water',
    'Agriculture',
    'Water Stress',
    'Water Quality'
  ];

  const renderPage = () => {
    switch (activeTab) {
      case 0:
        return <StudyAreaPage />;
      case 1:
        return <WaterAvailabilityPageWorking />;
      case 2:
        return <DemographyPageWorking />;
      case 3:
        return <EcologicalWaterPage />;
      case 4:
        return <AgriculturePage />;
      case 5:
        return <WaterStressPage />;
      case 6:
        return <WaterQualityPage />;
      default:
        return <StudyAreaPage />;
    }
  };

  return (
    <div className="h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Yangtze River Basin Water Resource Analysis
        </h1>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200">
          <nav className="p-4">
            <ul className="space-y-2">
              {tabs.map((tab, index) => (
                <li key={index}>
                  <button
                    onClick={() => setActiveTab(index)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeTab === index
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="inline-flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        activeTab === index ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      {tab}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto h-full">
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  );
}
