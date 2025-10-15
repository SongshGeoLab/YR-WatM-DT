"""Configuration loader for application settings.

This module provides utilities to load and access configuration from YAML and JSON files.
Configurations include terminology, thresholds, API settings, and preset scenarios.

Google-style docstrings are used.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional

import yaml  # type: ignore[import-untyped]


class ConfigLoader:
    """Load and manage application configuration files.

    This class provides centralized access to all configuration files including
    app settings, preset scenarios, and explanation content.
    """

    def __init__(self, config_dir: Optional[Path] = None):
        """Initialize the configuration loader.

        Args:
            config_dir: Path to configuration directory. Defaults to 'config/' in project root.
        """
        if config_dir is None:
            # Default to config/ directory at project root
            project_root = Path(__file__).parent.parent.parent
            config_dir = project_root / "config"

        self.config_dir = Path(config_dir)
        self._app_config: Optional[Dict[str, Any]] = None
        self._scenarios_preset: Optional[Dict[str, Any]] = None
        self._explanations: Optional[Dict[str, Any]] = None

    def load_app_config(self) -> Dict[str, Any]:
        """Load main application configuration from app_config.yaml.

        Returns:
            Dictionary containing all application configuration including terminology,
            thresholds, API settings, etc.

        Raises:
            FileNotFoundError: If app_config.yaml does not exist.
            yaml.YAMLError: If YAML parsing fails.
        """
        if self._app_config is not None:
            return self._app_config

        config_path = self.config_dir / "app_config.yaml"
        if not config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_path}")

        with open(config_path, "r", encoding="utf-8") as f:
            self._app_config = yaml.safe_load(f)

        return self._app_config

    def load_scenarios_preset(self) -> Dict[str, Any]:
        """Load preset scenarios configuration from scenarios_preset.json.

        Returns:
            Dictionary containing preset scenario definitions with parameters.

        Raises:
            FileNotFoundError: If scenarios_preset.json does not exist.
            json.JSONDecodeError: If JSON parsing fails.
        """
        if self._scenarios_preset is not None:
            return self._scenarios_preset

        config_path = self.config_dir / "scenarios_preset.json"
        if not config_path.exists():
            raise FileNotFoundError(f"Preset scenarios file not found: {config_path}")

        with open(config_path, "r", encoding="utf-8") as f:
            self._scenarios_preset = json.load(f)

        return self._scenarios_preset

    def load_explanations(self) -> Dict[str, Any]:
        """Load explanation content from explanations.yaml.

        Returns:
            Dictionary containing explanation content for help popovers.

        Raises:
            FileNotFoundError: If explanations.yaml does not exist.
            yaml.YAMLError: If YAML parsing fails.
        """
        if self._explanations is not None:
            return self._explanations

        config_path = self.config_dir / "explanations.yaml"
        if not config_path.exists():
            raise FileNotFoundError(f"Explanations file not found: {config_path}")

        with open(config_path, "r", encoding="utf-8") as f:
            self._explanations = yaml.safe_load(f)

        return self._explanations

    def get_terminology(self, lang: str = "en") -> Dict[str, Any]:
        """Get terminology mappings for display labels.

        Args:
            lang: Language code ('en' or 'cn'). Defaults to 'en'.

        Returns:
            Dictionary mapping parameter keys to their display information including
            labels, descriptions, and options in the specified language.
        """
        config = self.load_app_config()
        terminology = config.get("terminology", {})

        # Transform terminology to include language-specific labels
        result = {}
        for key, value in terminology.items():
            result[key] = {
                "internal": value.get("internal"),
                "display": value.get(f"display_{lang}", value.get("display_en")),
                "description": value.get(
                    f"description_{lang}", value.get("description_en", "")
                ),
                "unit": value.get(f"unit_{lang}", value.get("unit", "")),
            }

            # Include options if present
            if "options" in value:
                result[key]["options"] = {
                    k: v.get(lang, v.get("en", str(k)))
                    for k, v in value["options"].items()
                }

        return result

    def get_water_stress_config(self) -> Dict[str, Any]:
        """Get water stress index configuration.

        Returns:
            Dictionary containing WSI thresholds, colors, and gauge settings.
        """
        config = self.load_app_config()
        return config.get("water_stress_index", {})

    def get_peak_annotation_config(self) -> Dict[str, Any]:
        """Get peak annotation configuration.

        Returns:
            Dictionary containing peak/valley annotation settings.
        """
        config = self.load_app_config()
        return config.get("peak_annotation", {})

    def get_api_config(self) -> Dict[str, Any]:
        """Get API configuration.

        Returns:
            Dictionary containing API base URL and endpoint paths.
        """
        config = self.load_app_config()
        return config.get("api", {})

    def get_chart_config(self) -> Dict[str, Any]:
        """Get default chart configuration.

        Returns:
            Dictionary containing default chart settings for Plotly.
        """
        config = self.load_app_config()
        return config.get("charts", {})

    def get_performance_config(self) -> Dict[str, Any]:
        """Get performance optimization configuration.

        Returns:
            Dictionary containing debounce delays, caching settings, etc.
        """
        config = self.load_app_config()
        return config.get("performance", {})

    def get_feature_flags(self) -> Dict[str, bool]:
        """Get feature flags for enabling/disabling features.

        Returns:
            Dictionary mapping feature names to enabled/disabled state.
        """
        config = self.load_app_config()
        return config.get("features", {})

    def get_preset_scenarios(self, lang: str = "en") -> list[Dict[str, Any]]:
        """Get list of preset scenarios with language-specific labels.

        Args:
            lang: Language code ('en' or 'cn'). Defaults to 'en'.

        Returns:
            List of preset scenario dictionaries with translated names and descriptions.
        """
        scenarios_config = self.load_scenarios_preset()
        scenarios = scenarios_config.get("scenarios", [])

        # Add language-specific labels
        result = []
        for scenario in scenarios:
            translated = scenario.copy()
            if "name" in scenario and isinstance(scenario["name"], dict):
                translated["name"] = scenario["name"].get(
                    lang, scenario["name"].get("en", "")
                )
            if "description" in scenario and isinstance(scenario["description"], dict):
                translated["description"] = scenario["description"].get(
                    lang, scenario["description"].get("en", "")
                )
            if "story" in scenario and isinstance(scenario["story"], dict):
                translated["story"] = scenario["story"].get(
                    lang, scenario["story"].get("en", "")
                )
            result.append(translated)

        return result

    def get_explanation(self, key: str, lang: str = "en") -> Optional[Dict[str, Any]]:
        """Get explanation content for a specific topic.

        Args:
            key: Explanation key (e.g., 'diet_water_footprint').
            lang: Language code ('en' or 'cn'). Defaults to 'en'.

        Returns:
            Dictionary containing title and content in specified language,
            or None if key not found.
        """
        explanations = self.load_explanations()
        explanation_data = explanations.get("explanations", {}).get(key)

        if not explanation_data:
            return None

        return {
            "title": explanation_data.get("title", {}).get(lang, ""),
            "content": explanation_data.get("content", {}).get(lang, ""),
        }


# Global config loader instance
_config_loader: Optional[ConfigLoader] = None


def get_config_loader() -> ConfigLoader:
    """Get global configuration loader instance.

    Returns:
        Singleton ConfigLoader instance.
    """
    global _config_loader
    if _config_loader is None:
        _config_loader = ConfigLoader()
    return _config_loader
