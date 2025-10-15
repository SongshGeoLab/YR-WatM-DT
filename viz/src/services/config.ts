/**
 * Configuration service for loading app settings from backend.
 *
 * This service fetches configuration from the FastAPI backend including
 * terminology, preset scenarios, explanations, and threshold settings.
 */

import { ScenarioParameters } from '../contexts/ScenarioContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TerminologyOption {
  en: string;
  cn: string;
}

export interface TerminologyItem {
  internal: string;
  display: string;
  description?: string;
  unit?: string;
  options?: Record<string | number, string>;
}

export interface Terminology {
  [key: string]: TerminologyItem;
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  story?: string;
  parameters: ScenarioParameters;
  color?: string;
  icon?: string;
}

export interface WaterStressConfig {
  variable_name: string;
  display_en: string;
  display_cn: string;
  thresholds: {
    critical: number;
    warning: number;
    safe: number;
  };
  threshold_labels: {
    critical: { en: string; cn: string };
    warning: { en: string; cn: string };
    safe: { en: string; cn: string };
  };
  thresholds_editable: boolean;
  color_scheme: {
    safe: string;
    warning: string;
    critical: string;
  };
  gauge?: {
    min: number;
    max: number;
    steps: Array<{ range: [number, number]; color: string }>;
  };
}

export interface ExplanationContent {
  title: string;
  content: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch terminology mappings from backend.
 *
 * @param lang - Language code ('en' or 'cn')
 * @returns Promise resolving to terminology dictionary
 */
export async function fetchTerminology(lang: string = 'en'): Promise<Terminology> {
  try {
    const response = await fetch(`${API_BASE_URL}/config/terminology?lang=${lang}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch terminology: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching terminology:', error);
    // Return empty object on error
    return {};
  }
}

/**
 * Fetch preset scenarios from backend.
 *
 * @param lang - Language code ('en' or 'cn')
 * @returns Promise resolving to array of preset scenarios
 */
export async function fetchPresetScenarios(lang: string = 'en'): Promise<PresetScenario[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/config/scenarios_preset?lang=${lang}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch preset scenarios: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching preset scenarios:', error);
    return [];
  }
}

/**
 * Fetch water stress index configuration.
 *
 * @returns Promise resolving to water stress configuration
 */
export async function fetchWaterStressConfig(): Promise<WaterStressConfig | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/config/water_stress`);
    if (!response.ok) {
      throw new Error(`Failed to fetch water stress config: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching water stress config:', error);
    return null;
  }
}

/**
 * Fetch explanation content for a specific topic.
 *
 * @param key - Explanation key (e.g., 'diet_water_footprint')
 * @param lang - Language code ('en' or 'cn')
 * @returns Promise resolving to explanation content or null if not found
 */
export async function fetchExplanation(
  key: string,
  lang: string = 'en'
): Promise<ExplanationContent | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/config/explanations/${key}?lang=${lang}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch explanation: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching explanation for '${key}':`, error);
    return null;
  }
}

// ============================================================================
// Cache Management
// ============================================================================

let terminologyCache: { [lang: string]: Terminology } = {};
let presetScenariosCache: { [lang: string]: PresetScenario[] } = {};
let waterStressConfigCache: WaterStressConfig | null = null;

/**
 * Get terminology with caching.
 *
 * @param lang - Language code
 * @returns Promise resolving to terminology dictionary
 */
export async function getTerminology(lang: string = 'en'): Promise<Terminology> {
  if (terminologyCache[lang]) {
    return terminologyCache[lang];
  }

  const terminology = await fetchTerminology(lang);
  terminologyCache[lang] = terminology;
  return terminology;
}

/**
 * Get preset scenarios with caching.
 *
 * @param lang - Language code
 * @returns Promise resolving to preset scenarios array
 */
export async function getPresetScenarios(lang: string = 'en'): Promise<PresetScenario[]> {
  if (presetScenariosCache[lang]) {
    return presetScenariosCache[lang];
  }

  const scenarios = await fetchPresetScenarios(lang);
  presetScenariosCache[lang] = scenarios;
  return scenarios;
}

/**
 * Get water stress configuration with caching.
 *
 * @returns Promise resolving to water stress config or null
 */
export async function getWaterStressConfig(): Promise<WaterStressConfig | null> {
  if (waterStressConfigCache) {
    return waterStressConfigCache;
  }

  const config = await fetchWaterStressConfig();
  if (config) {
    waterStressConfigCache = config;
  }
  return config;
}

/**
 * Clear all configuration caches.
 * Useful when switching languages or reloading configuration.
 */
export function clearConfigCache(): void {
  terminologyCache = {};
  presetScenariosCache = {};
  waterStressConfigCache = null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get display label for a parameter value.
 *
 * @param terminology - Terminology dictionary
 * @param paramKey - Parameter key (e.g., 'diet_pattern')
 * @param value - Parameter value (e.g., 1, 2, 3)
 * @returns Display label or value as string if not found
 */
export function getParameterLabel(
  terminology: Terminology,
  paramKey: string,
  value: any
): string {
  const term = terminology[paramKey];
  if (!term) {
    return String(value);
  }

  if (term.options && value in term.options) {
    return term.options[value];
  }

  return String(value);
}

/**
 * Get parameter display name.
 *
 * @param terminology - Terminology dictionary
 * @param paramKey - Parameter key
 * @returns Display name or key if not found
 */
export function getParameterDisplayName(
  terminology: Terminology,
  paramKey: string
): string {
  const term = terminology[paramKey];
  return term?.display || paramKey;
}
