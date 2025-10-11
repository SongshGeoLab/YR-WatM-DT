import React, { useState, useEffect } from 'react';
import { Moon, Sun, FileText, Github, Map, Waves, Users, TreePine, Sprout, Gauge, Activity, CloudRain, Settings } from 'lucide-react';

// Import all page components
import StudyAreaPage from './components/pages/StudyAreaPage';
import WaterAvailabilityPage from './components/pages/WaterAvailabilityPage';
import DemographicsPageOptimized from './components/pages/DemographicsPageOptimized';
import { EcologicalWaterPageSlider } from './components/pages/EcologicalWaterPageSlider';
import WaterDemandPageWithRealData from './components/pages/WaterDemandPageWithRealData';
import WaterStressPageWithGlobalParams from './components/pages/WaterStressPageWithGlobalParams';
import AgriculturePage from './components/pages/AgriculturePage';
import WaterQualityPage from './components/pages/WaterQualityPage';

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
      case 2: return <DemographicsPageOptimized />;
      case 3: return <EcologicalWaterPageSlider />;
      case 4: return <WaterDemandPageWithRealData />;
      case 5: return <WaterStressPageWithGlobalParams />;
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
            <div className="flex flex-col gap-2">
              {/* Global Parameters Button */}
              <button
                onClick={() => setShowGlobalParams(!showGlobalParams)}
                className={`w-full px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  showGlobalParams
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                }`}
                aria-label="Toggle global parameters"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Parameters</span>
              </button>

              {/* Other Actions */}
            <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={toggleDarkMode}
                    className="w-9 h-9 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors flex items-center justify-center"
                  aria-label="Toggle dark mode"
                  >
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => window.open('https://example.com/paper', '_blank')}
                    className="w-9 h-9 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors flex items-center justify-center"
                  aria-label="View research paper"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.open('https://github.com/username/yellow-river-analysis', '_blank')}
                    className="w-9 h-9 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors flex items-center justify-center"
                  aria-label="View source code"
                  >
                    <Github className="w-4 h-4" />
                  </button>
                  </div>
            </div>
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
