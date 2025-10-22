import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

// Import page components
import StudyAreaPage from './components/pages/StudyAreaPage';
import WaterAvailabilityPage from './components/pages/WaterAvailabilityPage';
import DemographicsPageOptimized from './components/pages/DemographicsPageOptimized';
import { EcologicalWaterPageSlider } from './components/pages/EcologicalWaterPageSlider';
import WaterDemandPageWithRealData from './components/pages/WaterDemandPageWithRealData';
import WaterStressIndexPage from './components/pages/WaterStressIndexPage';
import RiverAnalysisPage from './components/pages/RiverAnalysisPage';

// Import global state provider
import { ScenarioProvider } from './contexts/ScenarioContext';

// Page wrapper component for individual pages
import PageWrapper from './PageWrapper';

createRoot(document.getElementById("root")!).render(
  <ScenarioProvider>
    <BrowserRouter>
      <Routes>
        {/* Default route - redirect to page 1 or show the original tabbed app */}
        <Route path="/" element={<App />} />
        
        {/* Individual page routes for multi-window display */}
        <Route path="/page1" element={
          <PageWrapper pageNumber={1} pageTitle="Study Area" pageColor="blue">
            <StudyAreaPage />
          </PageWrapper>
        } />
        
        <Route path="/page2" element={
          <PageWrapper pageNumber={2} pageTitle="Water Availability" pageColor="cyan">
            <WaterAvailabilityPage />
          </PageWrapper>
        } />
        
        <Route path="/page3" element={
          <PageWrapper pageNumber={3} pageTitle="Demographics" pageColor="purple">
            <DemographicsPageOptimized />
          </PageWrapper>
        } />
        
        <Route path="/page4" element={
          <PageWrapper pageNumber={4} pageTitle="Ecological Water" pageColor="green">
            <EcologicalWaterPageSlider />
          </PageWrapper>
        } />
        
        <Route path="/page5" element={
          <PageWrapper pageNumber={5} pageTitle="Agriculture" pageColor="orange">
            <WaterDemandPageWithRealData />
          </PageWrapper>
        } />
        
        <Route path="/page6" element={
          <PageWrapper pageNumber={6} pageTitle="WSI Focus" pageColor="red">
            <WaterStressIndexPage />
          </PageWrapper>
        } />
        
        <Route path="/page7" element={
          <PageWrapper pageNumber={7} pageTitle="Water Quality" pageColor="indigo">
            <RiverAnalysisPage />
          </PageWrapper>
        } />
      </Routes>
    </BrowserRouter>
  </ScenarioProvider>
);
