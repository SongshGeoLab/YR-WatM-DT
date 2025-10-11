import { useState, useEffect } from 'react';
import { PlotlyChart } from './components/charts/PlotlyChart';
import { LeafletMap } from './components/maps/LeafletMap';
import { ParameterSlider } from './components/ui/parameter-slider';
import { Tooltip, TooltipTrigger, TooltipContent } from './components/ui/tooltip';
import { Moon, Sun, FileText, Github, Droplet, Map, Waves, Users, Leaf, Sprout, AlertTriangle, Activity, CloudRain, TrendingUp, TreePine, Tractor, Gauge, Scale, Factory } from 'lucide-react';

// Import page components - keep only the ones actually used
import { EcologicalWaterPageSlider } from './components/pages/EcologicalWaterPageSlider';
import WaterDemandPageWithExportedData from './components/pages/WaterDemandPageWithExportedData';
import WaterStressPageReady from './components/pages/WaterStressPageReady';

// Extract demographics hook into separate file for better maintainability
import { useDemographicsSeries } from './hooks/useDemographicsSeries';

// Simple page components to avoid webpack issues
function StudyAreaPage() {
  const [selectedScenario, setSelectedScenario] = useState('tSSP1-RCP2.6');

  const scenarios = {
    'tSSP1-RCP2.6': {
      name: 'Radical sustainable transformation',
      code: 'tSSP1-RCP2.6',
      color: 'bg-green-500',
      icon: Leaf,
      description: 'Green technology revolution, social equity, and integrated governance with radical ecological restoration'
    },
    'tSSP2-RCP4.5': {
      name: 'Balancing economy and sustainability',
      code: 'tSSP2-RCP4.5',
      color: 'bg-amber-500',
      icon: Scale,
      description: 'Seeking balance between economic growth and ecosystem protection with moderate policy implementation'
    },
    'tSSP5-RCP8.5': {
      name: 'Focusing on economic development',
      code: 'tSSP5-RCP8.5',
      color: 'bg-red-500',
      icon: Factory,
      description: 'Economy-driven development prioritizing growth over sustainability with high fossil fuel dependence'
    }
  };

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg">
          <Map className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Introduction</h1>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              Page 1
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Yellow River Basin Overview & Scenario Selection</p>
        </div>
      </div>

      {/* Global Scenario Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Global Scenario Selection</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Select a preset of parameters from three overall scenarios:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(scenarios).map(([key, scenario]) => {
            const Icon = scenario.icon;
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSelectedScenario(key)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedScenario === key
                        ? `${scenario.color} border-transparent text-white`
                        : 'bg-card border-border hover:border-muted-foreground text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selectedScenario === key
                          ? 'bg-white/20 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="font-medium">{scenario.name}</div>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-md">
                  <div className="space-y-2">
                    <div className="font-medium text-base">{scenario.name}</div>
                    <div className="text-sm opacity-90">{scenario.description}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Main content - Map and Description */}
      <div className="flex gap-8 max-h-[calc(100%-16rem)] overflow-hidden">
        {/* Left side - Description */}
        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          <div className="space-y-3 flex-shrink-0">
            <h3 className="font-semibold text-foreground text-lg">Yellow River Basin Overview</h3>
            <div className="space-y-3 text-foreground leading-relaxed text-base">
              <p>
                The Yellow River is the fifth-longest river globally, spans arid to semi-arid regions and is among
                those river basins most dramatically affected by human activity over the last century.
              </p>
              <p>
                Since the 1960s, engineering projects such as reservoir construction have fundamentally altered
                water flow and sediment transport. The basin experiences significant water use growth, mainly for
                irrigation, substantially reducing the river's discharge.
              </p>
            </div>
          </div>

          {/* Key Basin Features */}
          <div className="flex-1 bg-muted rounded-lg p-4 min-h-0 overflow-hidden">
            <h4 className="font-semibold text-foreground mb-3 text-base">Key Basin Features</h4>
            <div className="grid grid-cols-1 gap-2 text-base">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">Source Region:</span>
                <span className="text-foreground">Qinghai-Tibet Plateau (35-42% streamflow)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-medium">Upper Reach:</span>
                <span className="text-foreground">Cascading reservoirs, hydroenergy</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-600 font-medium">Loess Plateau:</span>
                <span className="text-foreground">Soil erosion, restoration projects</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Map */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-3 flex-shrink-0">
            <h3 className="font-semibold text-foreground mb-2 text-lg">Interactive Basin Map</h3>
          </div>
          <div className="flex-1 min-h-0 bg-muted rounded-lg border-2 border-dashed border-border overflow-hidden">
            <LeafletMap
              id="yellow-river-basin-map"
              height="100%"
              className="w-full h-full rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function WaterAvailabilityPage() {
  const [selectedScenario, setSelectedScenario] = useState('RCP2.6');

  const scenarios = {
    'RCP2.6': {
      name: 'RCP2.6',
      title: 'Radical Sustainable Transformation',
      color: '#10b981',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900',
      description: 'Green technology revolution with radical ecological restoration and advanced water recycling technologies'
    },
    'RCP4.5': {
      name: 'RCP4.5',
      title: 'Balancing Economy and Sustainability',
      color: '#f59e0b',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-900',
      description: 'Traditional industries coexist with green technologies, gradual renewable energy adoption'
    },
    'RCP8.5': {
      name: 'RCP8.5',
      title: 'Focusing on Economic Development',
      color: '#ef4444',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900',
      description: 'High fossil fuel dependence with rapid economic growth but inefficient water resource use'
    }
  };

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-lg">
          <CloudRain className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Climate Change Scenarios</h1>
            <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-sm font-medium">
              Page 2
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">RCP Pathways & Surface Water Availability Projections</p>
        </div>
      </div>

      {/* Scenario Selection */}
      <div className="mb-4 flex items-center justify-between bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-foreground">Climate Scenario:</h3>
          <div className="flex gap-2">
            {Object.entries(scenarios).map(([key, scenario]) => (
              <button
                key={key}
                onClick={() => setSelectedScenario(key)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedScenario === key
                    ? `${scenario.bgColor} ${scenario.borderColor} ${scenario.textColor} font-medium shadow-sm`
                    : 'bg-card border-border text-foreground hover:bg-muted'
                }`}
              >
                {scenario.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-4 h-[calc(100%-12rem)]">
        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0">
            <PlotlyChart
              id="rcp-climate-scenarios"
              title="RCP Climate Scenario Pathways"
              height="100%"
            />
          </div>
          <div className="flex-1 min-h-0">
            <PlotlyChart
              id="temperature-precipitation-trends"
              title="Temperature & Precipitation Trends"
              height="100%"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0 max-h-[50%]">
            <PlotlyChart
              id="surface-water-availability"
              title="Surface Water Availability Projections"
              height="100%"
            />
          </div>
          <div className="flex-1 bg-muted/50 rounded-lg p-4 overflow-y-auto">
            <h4 className="font-semibold text-foreground mb-3">
              {scenarios[selectedScenario].name}: Understanding the Scenario
            </h4>
            <div className="space-y-3 text-base text-foreground leading-relaxed">
              <p>{scenarios[selectedScenario].description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demographics component with extracted charts
function DemographicsPopulationChart({ fertility, diet }: { fertility: number; diet: number }) {
  const { population } = useDemographicsSeries(fertility, diet);
  const data = population.x.length ? [{ 
    x: population.x, 
    y: population.y, 
    type: 'scatter', 
    mode: 'lines', 
    line: { color: '#2E86AB', width: 3 } 
  }] : [];
  
  return (
    <PlotlyChart
      id="total-population"
      title="Total Population"
      description="Population change over time across different scenarios"
      height="320px"
      data={data}
      layout={{ 
        margin: { l: 50, r: 20, t: 20, b: 40 }, 
        xaxis: { title: 'Year' }, 
        yaxis: { title: 'People (Millions)' } 
      }}
    />
  );
}

function DemographicsPage() {
  const [selectedDietPattern, setSelectedDietPattern] = useState('pattern2');
  const [fertility, setFertility] = useState(1.7);
  const [debouncedFertility, setDebouncedFertility] = useState(1.7);
  const dietMap: Record<string, number> = { pattern1: 1, pattern2: 2, pattern3: 3 };

  // Debounce fertility changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFertility(fertility);
    }, 300);
    return () => clearTimeout(timer);
  }, [fertility]);

  const dietPatterns = {
    pattern1: { name: 'Pattern 1', title: 'Sustainable', color: 'bg-green-500', textColor: 'text-green-700' },
    pattern2: { name: 'Pattern 2', title: 'Moderate', color: 'bg-amber-500', textColor: 'text-amber-700' },
    pattern3: { name: 'Pattern 3', title: 'Unsustainable', color: 'bg-red-500', textColor: 'text-red-700' }
  };

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-lg">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Demography and Domestic Water Usage</h1>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
              Page 3
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Population Trends & Dietary Water Footprint</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-4rem)]">
        {/* Left side - Controls and small chart */}
        <div className="space-y-4">
          <div className="text-foreground text-base leading-relaxed">
            <p>
              <span className="font-medium">Population demographics significantly influence water demand patterns.</span>
              Changes in fertility rates and dietary preferences directly impact domestic water consumption.
            </p>
          </div>

          <DemographicsPopulationChart fertility={debouncedFertility} diet={dietMap[selectedDietPattern]} />

          <ParameterSlider
            label="Birth Rate"
            min={1.6}
            max={1.8}
            step={0.05}
            defaultValue={fertility}
            unit=""
            description="Total fertility rate (children per woman) affecting population growth"
            onChange={(v) => setFertility(v)}
          />

          {/* Diet Pattern Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-foreground">Diet Pattern</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(dietPatterns).map(([key, pattern]) => (
                <button
                  key={key}
                  onClick={() => setSelectedDietPattern(key)}
                  className={`p-2 rounded-lg border-2 transition-all text-center ${
                    selectedDietPattern === key
                      ? `border-opacity-50 bg-opacity-10 ${pattern.color.replace('bg-', 'bg-opacity-10 bg-')} border-current`
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className={`font-medium text-sm ${
                    selectedDietPattern === key ? pattern.textColor : 'text-foreground'
                  }`}>
                    {pattern.name}
                  </div>
                  <div className={`text-xs ${
                    selectedDietPattern === key ? pattern.textColor : 'text-muted-foreground'
                  }`}>
                    {pattern.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Charts */}
        <div className="flex flex-col gap-2 h-full">
          <div className="flex-1 min-h-0">
            <PlotlyChart
              id="demographics-chart-1"
              title="Domestic Water Demand"
              height="100%"
            />
          </div>
          <div className="flex-1 min-h-0">
            <PlotlyChart
              id="demographics-chart-2"
              title="OA Water Demand"
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AgriculturePage() {
  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-lg">
          <Sprout className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Agriculture and Industry</h1>
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">
              Page 5
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Irrigation Efficiency & Industrial Water Demand</p>
        </div>
      </div>

      <div className="space-y-3 h-[calc(100%-4rem)]">
        <div className="text-foreground text-base leading-relaxed">
          <p>
            <span className="font-medium">Agriculture accounts for approximately 65% of total water consumption</span>
            in the Yellow River Basin, while industry represents 23% of total demand.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ParameterSlider
            label="Water-saving Irrigation Efficiency Ratio"
            min={0.8}
            max={1.0}
            step={0.05}
            defaultValue={0.9}
            unit=""
            description="Efficiency ratio of water-saving irrigation technology in agriculture"
          />
          <ParameterSlider
            label="Fire Generation Share Province Target"
            min={0.1}
            max={0.4}
            step={0.05}
            defaultValue={0.25}
            unit=""
            description="Target share of fire-based power generation at provincial level"
          />
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <div className="min-h-0">
            <PlotlyChart
              id="water-demand-composition"
              title="Water Demand Composition"
              height="100%"
            />
          </div>
          <div className="min-h-0">
            <PlotlyChart
              id="total-water-demand-timeseries"
              title="Total Water Demand Time Series"
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function WaterQualityPage() {
  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg">
          <Activity className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Water and Sediment</h1>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
              Page 7
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Sediment Load Analysis & Global River Comparison</p>
        </div>
      </div>

      <div className="space-y-3 h-[calc(100%-4rem)]">
        <div className="text-foreground leading-relaxed text-base">
          <p>
            <span className="font-medium">The Yellow River is globally famous for its exceptionally high sediment load
            relative to its water discharge.</span> This unique characteristic distinguishes it from other major river
            systems worldwide.
          </p>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <div className="min-h-0">
            <PlotlyChart
              id="discharge-sediment-load"
              title="Global River Comparison: Discharge vs Sediment Load"
              height="100%"
            />
          </div>
          <div className="min-h-0">
            <PlotlyChart
              id="sediment-temporal-trends"
              title="Yellow River Sediment Load Temporal Trends"
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      setIsDarkMode(systemPrefersDark);
    }
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const tabs = [
    { name: 'Study Area', icon: Map, color: 'blue' },
    { name: 'Water Availability', icon: CloudRain, color: 'cyan' },
    { name: 'Demographics', icon: Users, color: 'purple' },
    { name: 'Ecological Water', icon: TreePine, color: 'green' },
    { name: 'Agriculture', icon: Sprout, color: 'orange' },
    { name: 'Water Stress', icon: Gauge, color: 'red' },
    { name: 'Water Quality', icon: Activity, color: 'indigo' }
  ];

  const renderPage = () => {
    switch (activeTab) {
      case 0: return <StudyAreaPage />;
      case 1: return <WaterAvailabilityPage />;
      case 2: return <DemographicsPage />;
      case 3: return <EcologicalWaterPageSlider />;
      case 4: return <WaterDemandPageWithExportedData />;
      case 5: return <WaterStressPageReady />;
      case 6: return <WaterQualityPage />;
      default: return <StudyAreaPage />;
    }
  };

  return (
    <div className="h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Yellow River Basin Water Resource Analysis
              </h1>
              <p className="text-xs text-muted-foreground">Interactive Data Visualization & Scenario Analysis Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
              2020-2100 Projection
            </span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-card border-r border-border flex flex-col">
          <nav className="p-4 flex-1">
            <ul className="space-y-2">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === index;
                
                return (
                  <li key={index}>
                    <button
                      onClick={() => setActiveTab(index)}
                      className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                        isActive
                          ? `bg-${tab.color}-100 dark:bg-${tab.color}-900/30 text-${tab.color}-700 dark:text-${tab.color}-300 font-medium shadow-sm`
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isActive
                            ? `bg-${tab.color}-500 text-white shadow-md`
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="flex-1">{tab.name}</span>
                        <span className={`text-xs font-medium ${
                          isActive ? 'opacity-70' : 'opacity-40'
                        }`}>
                          {index + 1}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleDarkMode}
                className="w-9 h-9 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors flex items-center justify-center"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => window.open('https://example.com/paper', '_blank')}
                className="w-9 h-9 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors flex items-center justify-center"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.open('https://github.com/username/yellow-river-analysis', '_blank')}
                className="w-9 h-9 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors flex items-center justify-center"
              >
                <Github className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-2 overflow-hidden">
          <div className="w-full h-full max-h-[calc(100vh-6rem)]">
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  );
}