# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.0] - 2024-12-XX

### Added
- Complete frontend page refactoring with all pages integrated
- Page 1: Introduction with river analysis bubble charts and interactive map
- Page 2: Climate Change Impact Analysis with real data integration and temperature/precipitation trends
- Page 3: Demographics & Domestic Water with multi-scenario analysis and peak detection
- Page 4: Water Demand Analysis with irrigation and production charts
- Page 5: Water Composition Analysis with treemap and time series
- Page 6: Ecological Water Analysis with parameter sliders
- Page 7: Water Stress Index Analysis with global scenario selection and threshold monitors
- Global parameter synchronization across all pages
- Real-time data comparison panels (now vs future)
- Optimized UI with responsive layouts and dark mode support
- WSI threshold monitors showing first year and continuous years below thresholds
- Cross-tab parameter synchronization
- RCP8.5 data quality issue handling (excluded from "Any" aggregation)

### Changed
- Migrated from notebook-based visualization to React-based web application
- Updated data fetching to use multi-scenario API endpoints
- Improved performance with client-side caching and optimized rendering
- Enhanced user experience with interactive parameter sliders
- File structure reorganization: WaterStressIndexPage → WaterDemandCompositionPage, WaterQualityPage → WaterStressIndexPage
- Climate scenario handling: excluded RCP8.5 from "Any" aggregation due to data quality issues
- Updated page routing and component mapping in App.tsx

### Fixed
- Resolved infinite loop issues in ScenarioContext
- Fixed data access patterns for single vs multi-scenario modes
- Corrected parameter range calculations for sliders
- Improved error handling and loading states
- Fixed temperature/precipitation chart display when "Any" scenario is selected
- Corrected WSI threshold monitor calculations for 2020+ data only
- Fixed RCP4.5 data display issues caused by incorrect RCP8.5 mapping

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
