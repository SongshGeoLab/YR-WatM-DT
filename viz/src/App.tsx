import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Moon, Sun, FileText, Github, Map, Waves, Users, TreePine, Sprout, Gauge, Activity, CloudRain, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

// Dynamic imports for better performance
const StudyAreaPage = lazy(() => import('./components/pages/StudyAreaPage'));
const WaterAvailabilityPage = lazy(() => import('./components/pages/WaterAvailabilityPage'));
const DemographicsPageOptimized = lazy(() => import('./components/pages/DemographicsPageOptimized'));
const EcologicalWaterPageSlider = lazy(() => import('./components/pages/EcologicalWaterPageSlider').then(m => ({ default: m.EcologicalWaterPageSlider })));
const WaterDemandPageWithRealData = lazy(() => import('./components/pages/WaterDemandPageWithRealData'));
const WaterDemandCompositionPage = lazy(() => import('./components/pages/WaterDemandCompositionPage'));
const WaterStressIndexPage = lazy(() => import('./components/pages/WaterStressIndexPage'));

// Import global state management
import { ScenarioProvider, useScenario } from './contexts/ScenarioContext';
import GlobalParameterPanel from './components/GlobalParameterPanel';

/**
 * Main Application Component (Inner)
 *
 * Yellow River Basin Water Resource Analysis Platform
 * 7-page interactive visualization with dark mode support
 */
function AppInner() {
  const [activeTab, setActiveTab] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showGlobalParams, setShowGlobalParams] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { scenarioResult, loading } = useScenario();

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

  // Initialize sidebar collapsed state from localStorage
  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null) {
      setSidebarCollapsed(JSON.parse(savedSidebarState));
    }
  }, []);

  // Save sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const tabs = [
    { name: 'Introduction', icon: Map, color: 'blue' },
    { name: 'Climate Change', icon: CloudRain, color: 'cyan' },
    { name: 'Demographics', icon: Users, color: 'purple' },
    { name: 'Water Demand', icon: Sprout, color: 'orange' },
    { name: 'Water Composition', icon: Gauge, color: 'red' },
    { name: 'Ecological Water', icon: TreePine, color: 'green' },
    { name: 'Water Stress Index', icon: Activity, color: 'indigo' }
  ];

  const renderPage = () => {
    const PageComponent = (() => {
      switch (activeTab) {
        case 0: return StudyAreaPage;
        case 1: return WaterAvailabilityPage;
        case 2: return DemographicsPageOptimized;
        case 3: return WaterDemandPageWithRealData; // Page 4
        case 4: return WaterDemandCompositionPage; // Page 5 (Water Composition Analysis)
        case 5: return EcologicalWaterPageSlider; // Page 6
        case 6: return WaterStressIndexPage; // Page 7 (Water Stress Index Analysis)
        default: return StudyAreaPage;
      }
    })();

    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading page...</p>
          </div>
        </div>
      }>
        <PageComponent />
      </Suspense>
    );
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
                   {scenarioResult && (
                     <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                       scenarioResult.isSingleScenario
                         ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                         : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                     }`}>
                       {scenarioResult.isSingleScenario
                         ? `Scenario: ${scenarioResult.primaryScenario}`
                         : `Multiple Scenarios (${scenarioResult.count || '?'})`
                       }
                     </span>
                   )}
                   {loading && (
                     <span className="px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-full text-xs font-medium animate-pulse">
                       Loading...
                     </span>
                   )}
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
              2020-2100 Projection
            </span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-72'} bg-card border-r border-border flex flex-col transition-all duration-300`}>
          {/* Sidebar Header with Toggle */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
                    <Waves className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Navigation</h2>
                    <p className="text-xs text-muted-foreground">7 Analysis Pages</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-8 h-8 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors flex items-center justify-center"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Navigation - Only show when expanded */}
            {!sidebarCollapsed && (
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
            )}

            {/* Other Actions - Only show when expanded */}
            {!sidebarCollapsed && (
              <div className="p-4 border-t border-border">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={toggleDarkMode}
                    className="w-9 h-9 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors flex items-center justify-center"
                    aria-label="Toggle dark mode"
                  >
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => window.open('https://www.nature.com/articles/s43017-025-00718-2', '_blank', 'noopener,noreferrer')}
                    className="w-9 h-9 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors flex items-center justify-center"
                    aria-label="View research paper"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.open('https://github.com/SongshGeoLab', '_blank', 'noopener,noreferrer')}
                    className="w-9 h-9 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors flex items-center justify-center"
                    aria-label="View SongshGeoLab on GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Global Parameters Button - Always show at bottom */}
          <div className="p-4 border-t border-border">
            <button
              onClick={() => setShowGlobalParams(!showGlobalParams)}
              className={`w-full px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                showGlobalParams
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground'
              }`}
              aria-label="Toggle global parameters"
              title={sidebarCollapsed ? "Parameters" : undefined}
            >
              <Settings className="w-4 h-4" />
              {!sidebarCollapsed && <span className="text-sm font-medium">Parameters</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-2 overflow-hidden relative">
          {/* Global Parameter Panel */}
          {showGlobalParams && (
            <GlobalParameterPanel onClose={() => setShowGlobalParams(false)} />
          )}

          <div className="w-full h-full max-h-[calc(100vh-6rem)]">
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * App Component with Global State Provider
 */
export default function App() {
  return (
    <ScenarioProvider>
      <AppInner />
    </ScenarioProvider>
  );
}
