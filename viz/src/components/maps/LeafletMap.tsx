import { useEffect, useRef, useState } from 'react';
import { getYellowRiverBasin, YellowRiverBasinData } from '../../services/api';

interface LeafletMapProps {
  id: string;
  className?: string;
  height?: string;
}

declare global {
  interface Window {
    L: any;
  }
}

export function LeafletMap({ id, className = "", height = "400px" }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMap = async () => {
      console.log('🗺️ Initializing Leaflet map...');
      console.log('Map ref:', mapRef.current);
      console.log('Leaflet available:', !!window.L);

      // Wait a bit for Leaflet to load if not immediately available
      if (!window.L) {
        console.log('⏳ Waiting for Leaflet library to load...');
        let attempts = 0;
        while (!window.L && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }

      if (!mapRef.current || !window.L) {
        console.error('❌ Leaflet library not loaded or map ref not available');
        setError('Leaflet library not loaded');
        setLoading(false);
        return;
      }

      try {
        // Initialize map centered on Yellow River Basin
        const map = window.L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true
        }).setView([35.0, 110.0], 6);

        mapInstanceRef.current = map;

        // Add multiple tile layers
        const osmLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          name: 'OpenStreetMap'
        });

        const satelliteLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© Esri',
          name: 'Satellite'
        });

        const cartoLayer = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '© CartoDB',
          name: 'CartoDB Light'
        });

        const darkLayer = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© CartoDB',
          name: 'CartoDB Dark'
        });

        // Add default layer
        osmLayer.addTo(map);

        // Add layer control
        const baseMaps = {
          'OpenStreetMap': osmLayer,
          'Satellite': satelliteLayer,
          'CartoDB Light': cartoLayer,
          'CartoDB Dark': darkLayer
        };

        const layerControl = window.L.control.layers(baseMaps).addTo(map);

        // Store layers for later reference
        map._basinLayer = null;

        // Create a layer group for overlays
        const overlayGroup = window.L.layerGroup().addTo(map);
        map._overlayGroup = overlayGroup;

        // Add a test marker to ensure map is working
        const testMarker = window.L.marker([35.0, 110.0])
          .bindPopup('Test marker - Map is working!')
          .addTo(overlayGroup);
        console.log('📍 Test marker added:', testMarker);

        // Add event listeners for debugging
        map.on('layeradd', (e) => {
          console.log('➕ Layer added:', e.layer);
        });

        map.on('layerremove', (e) => {
          console.log('➖ Layer removed:', e.layer);
        });

        // Load Yellow River Basin boundary
        try {
          console.log('🌊 Loading Yellow River Basin data...');
          const basinData: YellowRiverBasinData = await getYellowRiverBasin();
          console.log('✅ Basin data loaded:', basinData);

          // Create Yellow River Basin boundary layer
          const basinLayer = window.L.geoJSON(basinData, {
            style: {
              fillColor: '#3186cc',
              color: '#0d47a1',
              weight: 3,
              fillOpacity: 0.3,
              opacity: 0.8
            },
            onEachFeature: (feature: any, layer: any) => {
              layer.bindPopup('黄河流域边界<br/>Yellow River Basin');
            }
          });

          // Store reference to basin layer
          map._basinLayer = basinLayer;

          // Add basin layer to overlay group to ensure it stays visible
          setTimeout(() => {
            basinLayer.addTo(map._overlayGroup);
            console.log('🎨 Applied styles and added basin layer to overlay group');
          }, 100);

          console.log('🗺️ Basin layer added to map:', basinLayer);
          console.log('📐 Layer bounds:', basinLayer.getBounds());

          // Fit map to basin bounds with delay to ensure layer is added
          setTimeout(() => {
            if (basinLayer.getBounds().isValid()) {
              console.log('🎯 Fitting map to basin bounds...');
              const bounds = basinLayer.getBounds();
              console.log('📍 Bounds:', bounds.toString());
              map.fitBounds(bounds, { padding: [20, 20] });

              // Debug: Log map center and zoom
              setTimeout(() => {
                console.log('🗺️ Map center:', map.getCenter());
                console.log('🔍 Map zoom:', map.getZoom());
                console.log('📏 Map bounds:', map.getBounds());
                console.log('🌊 Basin layer visible:', map.hasLayer(basinLayer));
              }, 1000);
            } else {
              console.warn('⚠️ Basin layer bounds are invalid');
            }
          }, 200);
        } catch (basinError) {
          console.error('❌ Failed to load Yellow River Basin data:', basinError);
          // Continue without basin data
        }

        setLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map');
        setLoading(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <div
        ref={mapRef}
        id={id}
        className={`map-container bg-blue-50 rounded-lg flex items-center justify-center border border-gray-200 ${className}`}
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <div className="animate-spin text-2xl mb-2">🗺️</div>
          <div className="font-medium text-sm">Loading map...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        ref={mapRef}
        id={id}
        className={`map-container bg-red-50 rounded-lg flex items-center justify-center border border-red-200 ${className}`}
        style={{ height }}
      >
        <div className="text-center text-red-500">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="font-medium text-sm">Map Error</div>
          <div className="text-xs text-red-400 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      id={id}
      className={`map-container ${className}`}
      style={{
        height,
        position: 'relative',
        zIndex: 1
      }}
    />
  );
}
