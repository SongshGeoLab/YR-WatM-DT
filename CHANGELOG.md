# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.0] - 2024-12-XX

### Added
- Complete frontend page refactoring with all pages integrated
- Page 1: Introduction with river analysis bubble charts and interactive map
- Page 2: Climate Change Impact Analysis with real data integration
- Page 3: Demographics & Domestic Water with multi-scenario analysis
- Page 4: Ecological Water Analysis with parameter sliders
- Page 5: Water Demand Analysis with irrigation and production charts
- Page 6: Water Composition Analysis with treemap and time series
- Page 7: Water Stress Index with global scenario selection
- Global parameter synchronization across all pages
- Real-time data comparison panels (now vs future)
- Optimized UI with responsive layouts and dark mode support

### Changed
- Migrated from notebook-based visualization to React-based web application
- Updated data fetching to use multi-scenario API endpoints
- Improved performance with client-side caching and optimized rendering
- Enhanced user experience with interactive parameter sliders

### Fixed
- Resolved infinite loop issues in ScenarioContext
- Fixed data access patterns for single vs multi-scenario modes
- Corrected parameter range calculations for sliders
- Improved error handling and loading states

## [1.2.0] - 2024-XX-XX

### Added
- Multi-scenario query functionality with `/series/multi` endpoint
- Support for parameter aggregation and filtering
- Enhanced API client with flexible query options

### Changed
- Updated data processing pipeline for multi-scenario analysis
- Improved backend performance for large dataset queries

## [1.1.0] - 2024-XX-XX

### Added
- Initial water management decision theater implementation
- Basic visualization components and data processing
- Core API endpoints for scenario analysis

## [1.0.0] - 2024-XX-XX

### Added
- Initial project setup with Poetry configuration
- Basic project structure and documentation
- Core dependencies and development environment
