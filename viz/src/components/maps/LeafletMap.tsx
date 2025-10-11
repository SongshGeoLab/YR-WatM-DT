import React, { useEffect, useRef, useState } from 'react';
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
      // Wait for document to be completely loaded
      if (document.readyState !== 'complete') {
        await new Promise(resolve => {
          if (document.readyState === 'complete') {
            resolve(void 0);
          } else {
            window.addEventListener('load', () => resolve(void 0), { once: true });
          }
        });
      }

      // Wait for Leaflet to load
      if (!window.L) {
        let attempts = 0;
        while (!window.L && attempts < 100) {
          await new Promise(resolve => setTimeout(resolve, 50));
          attempts++;
        }
      }

      if (!mapRef.current || !window.L) {
        setError('Leaflet library not loaded');
        setLoading(false);
        return;
      }

      // Ensure container has dimensions
      const container = mapRef.current;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      try {
        // Initialize map centered on Yellow River Basin
        const map = window.L.map(container, {
          zoomControl: true,
          attributionControl: true,
          preferCanvas: false
        }).setView([35.0, 110.0], 6);

        mapInstanceRef.current = map;

        // Add multiple tile layers
        const osmLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          name: 'OpenStreetMap',
          maxZoom: 19
        });

        const satelliteLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© Esri',
          name: 'Satellite',
          maxZoom: 19
        });

        const cartoLayer = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '© CartoDB',
          name: 'CartoDB Light',
          maxZoom: 19
        });

        const darkLayer = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© CartoDB',
          name: 'CartoDB Dark',
          maxZoom: 19
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

        // Critical: Force map to recognize its size immediately after initialization
        // This ensures tiles load correctly on first render
        setTimeout(() => {
          map.invalidateSize(true);
        }, 100);

        // Load Yellow River Basin boundary
        try {
          const basinData: YellowRiverBasinData = await getYellowRiverBasin();

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
          basinLayer.addTo(map._overlayGroup);

          // Fit map to basin bounds
          if (basinLayer.getBounds().isValid()) {
            const bounds = basinLayer.getBounds();
            map.fitBounds(bounds, { padding: [20, 20], maxZoom: 8 });

            // Invalidate size after fitting bounds to ensure proper tile loading
            setTimeout(() => {
              map.invalidateSize(true);
            }, 100);
          }
        } catch (basinError) {
          console.error('Failed to load Yellow River Basin data:', basinError);
        }

        // Hide loading overlay after map is fully initialized
        setLoading(false);

        // Final size check after loading completes
        setTimeout(() => {
          map.invalidateSize(true);
        }, 200);

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

  return (
    <div
      style={{
        height,
        width: '100%',
        position: 'relative'
      }}
    >
      <div
        ref={mapRef}
        id={id}
        className={`map-container ${className}`}
        style={{
          height: '100%',
          width: '100%',
          position: 'relative',
          zIndex: 1,
          display: 'block',
          overflow: 'hidden'
        }}
      />

      {loading && (
        <div
          className="absolute inset-0 bg-blue-50 rounded-lg flex items-center justify-center border border-gray-200"
          style={{ zIndex: 2 }}
        >
          <div className="text-center text-gray-500">
            <div className="animate-spin text-2xl mb-2">🗺️</div>
            <div className="font-medium text-sm">Loading map...</div>
          </div>
        </div>
      )}

      {error && (
        <div
          className="absolute inset-0 bg-red-50 rounded-lg flex items-center justify-center border border-red-200"
          style={{ zIndex: 2 }}
        >
          <div className="text-center text-red-500">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="font-medium text-sm">Map Error</div>
            <div className="text-xs text-red-400 mt-1">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
