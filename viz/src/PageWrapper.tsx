import React, { useState, useEffect } from 'react';
import { Moon, Sun, Settings } from 'lucide-react';
import { useScenario } from './contexts/ScenarioContext';
import GlobalParameterPanel from './components/GlobalParameterPanel';

interface PageWrapperProps {
  children: React.ReactNode;
  pageNumber: number;
  pageTitle: string;
  pageColor: string;
}

/**
 * PageWrapper Component
 * 
 * Wraps individual pages for multi-window display.
 * Provides header, dark mode toggle, and global parameter panel.
 */
export default function PageWrapper({ children, pageNumber, pageTitle, pageColor }: PageWrapperProps) {
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

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg bg-${pageColor}-500 flex items-center justify-center text-white shadow-md font-bold text-xl`}>
              {pageNumber}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {pageTitle}
              </h1>
              <p className="text-xs text-muted-foreground">
                Yellow River Basin Analysis • Multi-Window Mode
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Scenario Status Badge */}
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

            {/* Global Parameters Button */}
            <button
              onClick={() => setShowGlobalParams(!showGlobalParams)}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                showGlobalParams
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground'
              }`}
              aria-label="Toggle global parameters"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Parameters</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors flex items-center justify-center"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Global Parameter Panel */}
        {showGlobalParams && (
          <GlobalParameterPanel onClose={() => setShowGlobalParams(false)} />
        )}

        {/* Page Content */}
        <div className="h-full w-full overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
