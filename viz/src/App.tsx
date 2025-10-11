function useDemographicsSeries(fertility: number, diet: number) {
  const [population, setPopulation] = useState<{x:number[]; y:number[]}>({ x: [], y: [] });
  const [domestic, setDomestic] = useState<{x:number[]; y:number[]}>({ x: [], y: [] });
  const [oa, setOa] = useState<{x:number[]; y:number[]}>({ x: [], y: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Cache params to avoid repeated calls
        const params = await api.getParams();
        const values = {
          "Fertility Variation": fertility,
          "Diet change scenario switch": diet,
          "water-saving irrigation efficiency ratio": params["water-saving irrigation efficiency ratio"][1],
          "fire generation share province target": params["fire generation share province target"][1],
          "Ecological water flow variable": params["Ecological water flow variable"][1],
          "Climate change scenario switch for water yield": params["Climate change scenario switch for water yield"][1]
        };

        const { scenario_name } = await api.resolveScenario(values);

        // Only fetch the data we need, with smaller time range for faster response
        const [pop, dom, oaVar] = await Promise.all([
          api.getSeries('total_population', scenario_name, { start_step: 624, end_step: 1000 }), // Reduced range
          api.getSeries('domestic_water_demand_province_sum', scenario_name, { start_step: 624, end_step: 1000 }),
          api.getSeries('oa_water_demand_province_sum', scenario_name, { start_step: 624, end_step: 1000 })
        ]);

        // Optimized sampling - pre-calculate year indices
        const targetYears = [2020, 2025, 2030, 2035, 2040, 2045, 2050, 2055, 2060];
        const sampleData = (time: number[], value: number[], scale = 1) => {
          const xs: number[] = [];
          const ys: number[] = [];

          for (const year of targetYears) {
            // Find closest time point more efficiently
            let closestIdx = 0;
            let minDiff = Math.abs(time[0] - year);

            for (let i = 1; i < time.length; i++) {
              const diff = Math.abs(time[i] - year);
              if (diff < minDiff) {
                minDiff = diff;
                closestIdx = i;
              }
            }

            xs.push(Math.round(time[closestIdx]));
            ys.push(value[closestIdx] * scale);
          }

          return { x: xs, y: ys };
        };

        if (!cancelled) {
          setPopulation(sampleData(pop.series.time, pop.series.value, 1/1e6));
          setDomestic(sampleData(dom.series.time, dom.series.value, 1/1e9));
          setOa(sampleData(oaVar.series.time, oaVar.series.value, 1/1e9));
        }
      } catch (error) {
        console.error('Failed to load demographics data:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [fertility, diet]);

  return { population, domestic, oa, loading };
}

function DemographicsPopulationChart({ fertility, diet }: { fertility: number; diet: number }) {
  const { population } = useDemographicsSeries(fertility, diet);
  const data = population.x.length ? [{ x: population.x, y: population.y, type: 'scatter', mode: 'lines', line: { color: '#2E86AB', width: 3 } }] : [];
  return (
    <PlotlyChart
      id="total-population"
      title="Total Population"
      description="Population change over time across different scenarios"
      height="320px"
      data={data}
      layout={{ margin: { l: 50, r: 20, t: 20, b: 40 }, xaxis: { title: 'Year' }, yaxis: { title: 'People (Millions)' } }}
    />
  );
}

function DemographicsDomesticChart({ fertility, diet }: { fertility: number; diet: number }) {
  const { domestic } = useDemographicsSeries(fertility, diet);
  const data = domestic.x.length ? [{ x: domestic.x, y: domestic.y, type: 'scatter', mode: 'lines', line: { color: '#A23B72', width: 3 } }] : [];
  return (
    <PlotlyChart
      id="domestic-water-demand"
      title="Domestic Water Demand"
      description="Household water consumption patterns across different scenarios"
      height="350px"
      data={data}
      layout={{ margin: { l: 50, r: 20, t: 20, b: 40 }, xaxis: { title: 'Year' }, yaxis: { title: 'Volume (Billions)' } }}
    />
  );
}

function DemographicsOAChart({ fertility, diet }: { fertility: number; diet: number }) {
  const { oa } = useDemographicsSeries(fertility, diet);
  const data = oa.x.length ? [{ x: oa.x, y: oa.y, type: 'scatter', mode: 'lines', line: { color: '#F18F01', width: 3 } }] : [];
  return (
    <PlotlyChart
      id="oa-water-demand"
      title="OA Water Demand"
      description="Other activities water demand including services and public usage"
      height="350px"
      data={data}
      layout={{ margin: { l: 50, r: 20, t: 20, b: 40 }, xaxis: { title: 'Year' }, yaxis: { title: 'Volume (Billions)' } }}
    />
  );
}
import { useState, useEffect } from 'react';
import { PlotlyChart } from './components/charts/PlotlyChart';
import { LeafletMap } from './components/maps/LeafletMap';
import { ParameterSlider } from './components/ui/parameter-slider';
import { Tooltip, TooltipTrigger, TooltipContent } from './components/ui/tooltip';
import { Moon, Sun, FileText, Github, Droplet, Map, Waves, Users, Leaf, Sprout, AlertTriangle, Activity, CloudRain, TrendingUp, TreePine, Tractor, Gauge, Scale, Factory } from 'lucide-react';
import * as api from './services/api';

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
                    <div className="text-sm mt-3 pt-3 border-t border-white/20">
                      <div><strong>Parameters:</strong></div>
                      <div>• Climate scenario: {scenario.code.split('-')[1] || scenario.code}</div>
                      <div>• Socioeconomic pathway: {scenario.code.split('-')[0] || 'Default'}</div>
                      <div>• Water management: {scenario.code.includes('tSSP1') ? 'Advanced' : scenario.code.includes('tSSP2') ? 'Moderate' : 'Conventional'}</div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-lg text-foreground">
            <strong>Selected:</strong> {scenarios[selectedScenario].description}
          </p>
        </div>
      </div>

      {/* Main content container with equal height columns */}
      <div className="flex gap-8 max-h-[calc(100%-16rem)] overflow-hidden">
        {/* Left side - Text description */}
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
              <p>
                Climate change and socioeconomic development create complex challenges for water resource management.
                The basin supports over 100 million people across multiple provinces, making sustainable water
                allocation critical for regional development.
              </p>
            </div>
          </div>

          {/* Key Basin Features - fills remaining space */}
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
              <div className="flex items-start gap-2">
                <span className="text-purple-600 font-medium">Lower Reach:</span>
                <span className="text-foreground">"Hanging river" above plains</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-600 font-medium">Modern Delta:</span>
                <span className="text-foreground">2.7×10³ km² new land since 1855</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-medium">Water Challenges:</span>
                <span className="text-foreground">Sediment load, flow regulation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Landscape Map */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-3 flex-shrink-0">
            <h3 className="font-semibold text-foreground mb-2 text-lg">Interactive Basin Map</h3>
            <p className="text-base text-muted-foreground">
              Explore Yellow River Basin features including source region, reservoirs, and delta.
            </p>
          </div>

          {/* Landscape Map Container - fills remaining space */}
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

      {/* Scenario Selection Bar */}
      <div className="mb-4 flex items-center justify-between bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-foreground">Climate Scenario:</h3>
          <div className="flex gap-2">
            {Object.entries(scenarios).map(([key, scenario]) => (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSelectedScenario(key)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      selectedScenario === key
                        ? `${scenario.bgColor} ${scenario.borderColor} ${scenario.textColor} font-medium shadow-sm`
                        : 'bg-card border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {scenario.name}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-md">
                  <div className="space-y-2">
                    <div className="font-medium">{scenario.name}: {scenario.title}</div>
                    <div className="text-base opacity-90">{scenario.description}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scenarios[selectedScenario].color }}></div>
          <span className="font-medium text-foreground">{scenarios[selectedScenario].title}</span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4 text-foreground text-base leading-relaxed">
        <p>
          <span className="font-medium">Climate scenarios drive water availability</span> through
          changes in temperature, precipitation patterns, and evapotranspiration rates across
          the Yellow River Basin. These scenarios are aligned with global climate models and provide
          the foundation for understanding future water resource challenges.
        </p>
      </div>

      {/* Main Content Grid: Left (2 charts) + Right (1 chart + description) */}
      <div className="grid grid-cols-2 gap-4 h-[calc(100%-12rem)]">
        {/* Left Column - Two Charts Stacked */}
        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0">
            <PlotlyChart
              id="rcp-climate-scenarios"
              title="RCP Climate Scenario Pathways"
              description="Representative Concentration Pathways (RCP) and emission trajectories"
              height="100%"
            />
          </div>
          <div className="flex-1 min-h-0">
            <PlotlyChart
              id="temperature-precipitation-trends"
              title="Temperature & Precipitation Trends"
              description="Historical and projected climate variable changes across scenarios"
              height="100%"
            />
          </div>
        </div>

        {/* Right Column - Chart + Description */}
        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0 max-h-[50%]">
            <PlotlyChart
              id="surface-water-availability"
              title="Surface Water Availability Projections"
              description="YRB surface water availability trends across different climate scenarios (2020-2100)"
              height="100%"
            />
          </div>

          {/* Detailed Scenario Description */}
          <div className="flex-1 bg-muted/50 rounded-lg p-4 border-2 border-dashed border-border overflow-y-auto">
            <h4 className="font-semibold text-foreground mb-3">
              {scenarios[selectedScenario].name}: Understanding the Scenario
            </h4>
            <div className="space-y-3 text-base text-foreground leading-relaxed">
              {selectedScenario === 'RCP2.6' && (
                <>
                  <p>
                    <span className="font-medium">RCP2.6</span> represents an ambitious climate mitigation pathway
                    where radiative forcing peaks at approximately 3 W/m² before 2100 and then declines. This scenario
                    assumes immediate and aggressive greenhouse gas emission reductions, widespread adoption of renewable
                    energy, and significant carbon capture technologies.
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Water Implications:</strong> Temperature increases limited to +1.5-2°C, precipitation
                    variability moderate (+5% to +10%), relatively stable water availability with manageable adaptation
                    requirements. Best-case scenario for long-term water security in the Yellow River Basin.
                  </p>
                </>
              )}
              {selectedScenario === 'RCP4.5' && (
                <>
                  <p>
                    <span className="font-medium">RCP4.5</span> describes a stabilization scenario where radiative
                    forcing stabilizes at 4.5 W/m² by 2100. This pathway assumes moderate climate policies are
                    implemented, with gradual transition to cleaner energy sources and incremental efficiency improvements.
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Water Implications:</strong> Temperature increases of +2.5-3.5°C, precipitation changes
                    ranging from -5% to +12%, increased seasonal variability requiring adaptive water management
                    strategies. Represents a middle-ground scenario requiring significant but achievable adaptations.
                  </p>
                </>
              )}
              {selectedScenario === 'RCP8.5' && (
                <>
                  <p>
                    <span className="font-medium">RCP8.5</span> represents a high-emission pathway where radiative
                    forcing reaches &gt;8.5 W/m² by 2100. This scenario assumes continued heavy reliance on fossil
                    fuels, rapid population growth, and limited climate mitigation efforts throughout the century.
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Water Implications:</strong> Temperature increases of +4-5°C, highly variable precipitation
                    (-10% to +15%), severe water stress periods, increased drought frequency and intensity. Represents
                    worst-case scenario requiring transformative adaptation measures and potential limits to water
                    availability for all sectors.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemographicsPage() {
  const [selectedDietPattern, setSelectedDietPattern] = useState('pattern2');
  const [fertility, setFertility] = useState(1.7);
  const [debouncedFertility, setDebouncedFertility] = useState(1.7);
  const dietMap: Record<string, number> = { pattern1: 1, pattern2: 2, pattern3: 3 };

  // Debounce fertility changes to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFertility(fertility);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [fertility]);

  const dietPatterns = {
    pattern1: {
      name: 'Pattern 1',
      title: 'Sustainable',
      description: 'Plant-based diet with minimal meat consumption and lowest virtual water footprint',
      color: 'bg-green-500',
      borderColor: 'border-green-500',
      hoverColor: 'hover:bg-green-50 dark:hover:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300',
      level: 'Low meat, low water'
    },
    pattern2: {
      name: 'Pattern 2',
      title: 'Moderate',
      description: 'Balanced diet with moderate meat consumption and medium virtual water footprint',
      color: 'bg-amber-500',
      borderColor: 'border-amber-500',
      hoverColor: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
      textColor: 'text-amber-700 dark:text-amber-300',
      level: 'Medium meat, medium water'
    },
    pattern3: {
      name: 'Pattern 3',
      title: 'Unsustainable',
      description: 'Meat-intensive diet with high consumption and highest virtual water footprint',
      color: 'bg-red-500',
      borderColor: 'border-red-500',
      hoverColor: 'hover:bg-red-50 dark:hover:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-300',
      level: 'High meat, high water'
    }
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
        {/* Left side - Small chart and slider */}
        <div className="space-y-4">
          <div className="text-foreground text-base leading-relaxed">
            <p>
              <span className="font-medium">Population demographics significantly influence water demand patterns.</span>
              Changes in fertility rates, urbanization, and dietary preferences directly impact domestic water
              consumption across the Yellow River Basin.
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground cursor-help">ⓘ</span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <p className="text-base">
                    Dietary patterns represent different levels of meat consumption and their
                    associated virtual water footprints. Higher meat consumption requires
                    significantly more water resources per capita.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {Object.entries(dietPatterns).map(([key, pattern]) => {
                const dropletCount = key === 'pattern1' ? 2 : key === 'pattern2' ? 3 : 5;
                const dropletColor = key === 'pattern1' ? 'fill-green-500 text-green-500' :
                                    key === 'pattern2' ? 'fill-amber-500 text-amber-500' :
                                    'fill-red-500 text-red-500';

                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setSelectedDietPattern(key)}
                        className={`p-2 rounded-lg border-2 transition-all text-center ${
                          selectedDietPattern === key
                            ? `${pattern.borderColor} bg-opacity-10 ${pattern.color.replace('bg-', 'bg-opacity-10 bg-')}`
                            : `border-border ${pattern.hoverColor}`
                        }`}
                      >
                        <div className="flex justify-center gap-0.5 mb-1">
                          {Array.from({ length: dropletCount }).map((_, i) => (
                            <Droplet key={i} className={`w-3 h-3 ${dropletColor}`} />
                          ))}
                        </div>
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
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-2">
                        <div className="font-medium">{pattern.name}: {pattern.title}</div>
                        <div className="text-base opacity-90">{pattern.description}</div>
                        <div className="text-sm mt-2 pt-2 border-t border-white/20">
                          <strong>Water consumption:</strong> {pattern.level}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            <div className="text-sm text-muted-foreground mt-2">
              Selected: <span className="font-medium text-foreground">
                {dietPatterns[selectedDietPattern].title} - {dietPatterns[selectedDietPattern].level}
              </span>
            </div>
          </div>

          <div className="bg-muted/50 dark:bg-muted/20 border border-border rounded-lg p-3">
            <h4 className="font-medium text-foreground mb-3 text-base">Virtual Water by Food Type</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-5 bg-green-500 rounded"></div>
                  <span className="text-sm text-foreground">Vegetables</span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplet className="w-3 h-3 fill-green-500 text-green-500" />
                  <span className="text-sm font-medium text-foreground">322 L/kg</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-32 h-5 bg-blue-400 rounded"></div>
                  <span className="text-sm text-foreground">White Meat</span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplet className="w-3 h-3 fill-blue-400 text-blue-400" />
                  <Droplet className="w-3 h-3 fill-blue-400 text-blue-400" />
                  <Droplet className="w-3 h-3 fill-blue-400 text-blue-400" />
                  <span className="text-sm font-medium text-foreground">4,325 L/kg</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-48 h-5 bg-red-500 rounded"></div>
                  <span className="text-sm text-foreground">Red Meat</span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplet className="w-3 h-3 fill-red-500 text-red-500" />
                  <Droplet className="w-3 h-3 fill-red-500 text-red-500" />
                  <Droplet className="w-3 h-3 fill-red-500 text-red-500" />
                  <Droplet className="w-3 h-3 fill-red-500 text-red-500" />
                  <Droplet className="w-3 h-3 fill-red-500 text-red-500" />
                  <span className="text-sm font-medium text-foreground">15,415 L/kg</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Virtual water includes all water used in production process
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Two stacked charts */}
        <div className="flex flex-col gap-2 h-full">
          <div className="text-foreground text-base leading-relaxed flex-shrink-0">
            <p>
              Water consumption patterns vary significantly with demographic transitions.
              <span className="font-medium">Lower fertility rates and dietary changes</span> can reduce
              per capita water demand while urbanization may increase efficiency through improved infrastructure.
            </p>
          </div>

          <div className="flex-1 min-h-0">
            <DemographicsDomesticChart fertility={debouncedFertility} diet={dietMap[selectedDietPattern]} />
          </div>

          <div className="flex-1 min-h-0">
            <DemographicsOAChart fertility={debouncedFertility} diet={dietMap[selectedDietPattern]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Import the working ecological water page
import { EcologicalWaterPageSlider } from './components/pages/EcologicalWaterPageSlider';
// Import the water demand analysis page
import WaterDemandPageWithExportedData from './components/pages/WaterDemandPageWithExportedData';

function EcologicalWaterPage() {
  const [ecoFlowValue, setEcoFlowValue] = useState(0.25);

  // Mock statistics data based on eco flow value
  const statistics = {
    "0.20": {
      max_value: 4.704396624444445,
      max_year: 2100.0,
      min_value: 3.289904157777786,
      min_year: 2035.0,
      mean_value: 3.9563988238075405,
      trend_percent: 1.6677612623304625,
      n_years: 1281
    },
    "0.25": {
      max_value: 4.704396624444445,
      max_year: 2100.0,
      min_value: 3.289904157777786,
      min_year: 2035.0,
      mean_value: 3.9563988238075436,
      trend_percent: 5.347925561835946,
      n_years: 1281
    },
    "0.30": {
      max_value: 4.704396624444445,
      max_year: 2100.0,
      min_value: 3.289904157777786,
      min_year: 2035.0,
      mean_value: 3.9563988238075414,
      trend_percent: -2.622152197050572,
      n_years: 1281
    }
  };

  const currentStats = statistics[ecoFlowValue.toFixed(2)];

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-6 h-full overflow-hidden">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg">
          <TreePine className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Ecological Water</h1>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
              Page 4
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Environmental Flow Requirements & Sediment Management</p>
        </div>
      </div>

      <div className="space-y-3 h-[calc(100%-4rem)]">
        <div className="text-foreground leading-relaxed text-base flex-shrink-0">
          <p>
            Ecological water use refers to the proportion of water reserved each
            year for sediment flushing and environmental management, in order to maintain
            the river ecosystem. Managing flows for sediment flushing and environmental management is critical
            for maintaining biodiversity and ecosystem services in the Yellow River Basin.
          </p>
        </div>

        <ParameterSlider
          label="Eco Flow"
          min={0.2}
          max={0.3}
          step={0.05}
          defaultValue={0.25}
          unit=""
          description="Proportion of ecological flow for sediment flushing and environmental management"
          onChange={(value) => setEcoFlowValue(value)}
        />

        {/* Statistics Panel */}
        {currentStats && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex-shrink-0">
            <h4 className="font-semibold text-green-900 dark:text-green-200 mb-3 text-base">
              Key Statistics (Eco Flow = {ecoFlowValue.toFixed(2)})
            </h4>
            <div className="grid grid-cols-3 gap-4 text-base">
              <div>
                <div className="text-sm text-green-600 dark:text-green-400 mb-1">Maximum Value</div>
                <div className="font-bold text-green-700 dark:text-green-300">
                  {currentStats.max_value.toFixed(2)} km³
                </div>
                <div className="text-xs text-green-500 dark:text-green-500">Year {currentStats.max_year.toFixed(0)}</div>
              </div>
              <div>
                <div className="text-sm text-green-600 dark:text-green-400 mb-1">Minimum Value</div>
                <div className="font-bold text-green-700 dark:text-green-300">
                  {currentStats.min_value.toFixed(2)} km³
                </div>
                <div className="text-xs text-green-500 dark:text-green-500">Year {currentStats.min_year.toFixed(0)}</div>
              </div>
              <div>
                <div className="text-sm text-green-600 dark:text-green-400 mb-1">Mean Value</div>
                <div className="font-bold text-green-700 dark:text-green-300">
                  {currentStats.mean_value.toFixed(2)} km³
                </div>
                <div className="text-xs text-green-500 dark:text-green-500">
                  Trend: {currentStats.trend_percent > 0 ? '+' : ''}{currentStats.trend_percent.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0">
          <PlotlyChart
            id="ecological-water-flow"
            title="Ecological Water Flow Impact on Key Water Variables (2020-2100)"
            description="YRB Available Surface Water"
            height="100%"
          />
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
            in the Yellow River Basin, while industry represents 23% of total demand. Water-saving technologies
            and efficient irrigation systems are critical for sustainable development.
          </p>
          <p className="mt-2 text-base text-muted-foreground">
            The balance between irrigation water for agriculture and production water for industry creates complex
            trade-offs between food security and economic development, especially under changing climate conditions.
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

        <div className="grid grid-cols-3 gap-3 text-base flex-shrink-0">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2 text-center">
            <div className="font-bold text-orange-700 dark:text-orange-300">65%</div>
            <div className="text-orange-600 dark:text-orange-400">Agricultural Use</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 text-center">
            <div className="font-bold text-blue-700 dark:text-blue-300">23%</div>
            <div className="text-blue-600 dark:text-blue-400">Industrial Use</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2 text-center">
            <div className="font-bold text-green-700 dark:text-green-300">12%</div>
            <div className="text-green-600 dark:text-green-400">Domestic Use</div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <div className="min-h-0">
            <PlotlyChart
              id="water-demand-composition"
              title="Water Demand Composition"
              description="Proportional breakdown of water demand by sector and region"
              height="100%"
            />
          </div>
          <div className="min-h-0">
            <PlotlyChart
              id="total-water-demand-timeseries"
              title="Total Water Demand Time Series"
              description="Temporal trends in total water demand (2020-2100)"
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Import the WaterStressPageReady component with real charts
import WaterStressPageReady from './components/pages/WaterStressPageReady';

function WaterStressPage() {
  return <WaterStressPageReady />;
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
            systems worldwide and creates specific challenges for water management.
          </p>
          <p className="mt-2">
            Historical sediment concentrations averaged 35 kg/m³, earning the river its name from the distinctive
            yellow color. <span className="font-medium">Recent dam construction and soil conservation efforts have
            significantly reduced sediment loads</span>, altering downstream delta formation processes.
          </p>
          <p className="mt-2 text-base text-muted-foreground">
            Comparing discharge-to-sediment ratios with the Amazon, Mississippi, Ganges, and Mekong rivers reveals
            the Yellow River's unique position in global river hydrology. Understanding these patterns is crucial
            for sustainable sediment management and ecological flow requirements.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 text-base">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2 text-center">
            <div className="font-bold text-yellow-700 dark:text-yellow-300">35 kg/m³</div>
            <div className="text-yellow-600 dark:text-yellow-400">Historical Sediment</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 text-center">
            <div className="font-bold text-blue-700 dark:text-blue-300">58 km³/yr</div>
            <div className="text-blue-600 dark:text-blue-400">Average Discharge</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2 text-center">
            <div className="font-bold text-green-700 dark:text-green-300">-60%</div>
            <div className="text-green-600 dark:text-green-400">Sediment Reduction</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 text-center">
            <div className="font-bold text-red-700 dark:text-red-300">1.6 Gt/yr</div>
            <div className="text-red-600 dark:text-red-400">Peak Sediment Load</div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <div className="min-h-0">
            <PlotlyChart
              id="discharge-sediment-load"
              title="Global River Comparison: Discharge vs Sediment Load"
              description="Comparative analysis of sediment load ratios across major world river basins"
              height="100%"
            />
          </div>
          <div className="min-h-0">
            <PlotlyChart
              id="sediment-temporal-trends"
              title="Yellow River Sediment Load Temporal Trends"
              description="Historical and projected sediment concentration changes (1950-2100)"
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

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      setIsDarkMode(systemPrefersDark);
    }
  }, []);

  // Apply dark mode class to document
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
      case 0:
        return <StudyAreaPage />;
      case 1:
        return <WaterAvailabilityPage />;
      case 2:
        return <DemographicsPage />;
      case 3:
        return <EcologicalWaterPageSlider />; // ✅ Fully integrated with backend (USER'S ORIGINAL DESIGN)
      case 4:
        return <WaterDemandPageWithExportedData />;
      case 5:
        return <WaterStressPage />;
      case 6:
        return <WaterQualityPage />;
      default:
        return <StudyAreaPage />;
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
                const colorClasses = {
                  blue: isActive ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : '',
                  cyan: isActive ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' : '',
                  purple: isActive ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : '',
                  green: isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : '',
                  orange: isActive ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' : '',
                  red: isActive ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : '',
                  indigo: isActive ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : ''
                };

                return (
                  <li key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveTab(index)}
                          className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                            isActive
                              ? `${colorClasses[tab.color]} font-medium shadow-sm`
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
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-sm">
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {tab.name}
                          </div>
                          <div className="text-base opacity-90">
                            {index === 0 && "Explore the Yellow River Basin characteristics and global scenario selection"}
                            {index === 1 && "Analyze surface water availability under different climate scenarios"}
                            {index === 2 && "Examine population demographics and domestic water usage patterns"}
                            {index === 3 && "Understand ecological water requirements and environmental flows"}
                            {index === 4 && "Review agricultural and industrial water allocation strategies"}
                            {index === 5 && "Assess water stress indicators and critical threshold levels"}
                            {index === 6 && "Compare global sediment load patterns and water quality metrics"}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Action Icons */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleDarkMode}
                    className="w-9 h-9 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors flex items-center justify-center"
                  >
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-center">
                    <div className="font-medium">Theme</div>
                    <div className="text-base opacity-90">
                      Switch to {isDarkMode ? 'light' : 'dark'} mode
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => window.open('https://example.com/paper', '_blank')}
                    className="w-9 h-9 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors flex items-center justify-center"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-center">
                    <div className="font-medium">Research Paper</div>
                    <div className="text-base opacity-90">
                      View the original research publication
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => window.open('https://github.com/username/yellow-river-analysis', '_blank')}
                    className="w-9 h-9 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors flex items-center justify-center"
                  >
                    <Github className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-center">
                    <div className="font-medium">Source Code</div>
                    <div className="text-base opacity-90">
                      Access the GitHub repository
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
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
