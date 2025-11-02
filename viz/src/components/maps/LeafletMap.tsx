import React, { useEffect, useRef, useState } from 'react';
import { getYellowRiverBasin, getSWNP, YellowRiverBasinData } from '../../services/api';

interface LeafletMapProps {
  id: string;
  className?: string;
  height?: string;
  showSNWTP?: boolean;
}

declare global {
  interface Window {
    L: any;
  }
}

export function LeafletMap({ id, className = "", height = "400px", showSNWTP = false }: LeafletMapProps) {
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
        map._swntpLayer = null;

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
          try {
            if (map && map._container && map._loaded) {
              map.invalidateSize(true);
            }
          } catch (e) {
            console.warn('Could not invalidate size during initialization:', e);
          }
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

          // Fit map to basin bounds - with safety check
          if (basinLayer.getBounds().isValid()) {
            const bounds = basinLayer.getBounds();
            // Ensure map container is ready before fitting bounds
            setTimeout(() => {
              if (map && map._container && map._loaded) {
                try {
                  map.fitBounds(bounds, { padding: [20, 20], maxZoom: 8 });
                  map.invalidateSize(true);
                } catch (e) {
                  console.warn('Could not fit bounds, using default view:', e);
                  map.setView([35.0, 110.0], 6);
                }
              }
            }, 150);
          }
        } catch (basinError) {
          console.error('Failed to load Yellow River Basin data:', basinError);
        }

        // Load SNWTP layer immediately if showSNWTP is true on initial load
        if (showSNWTP && map._overlayGroup) {
          try {
            const swntpData: YellowRiverBasinData = await getSWNP();

            if (swntpData.features && swntpData.features.length > 0) {
              // Enhanced styling to ensure visibility
              const swntpLayer = window.L.geoJSON(swntpData, {
                style: (feature: any) => {
                  // Different styles for different geometry types
                  const geomType = feature?.geometry?.type;
                  const isLine = geomType === 'LineString' || geomType === 'MultiLineString';
                  const isPolygon = geomType === 'Polygon' || geomType === 'MultiPolygon';

                  if (isLine) {
                    return {
                      color: '#10b981',
                      weight: 5,
                      opacity: 1.0,
                      fillOpacity: 0.0,
                      dashArray: '10, 5'
                    };
                  } else if (isPolygon) {
                    return {
                      color: '#10b981',
                      weight: 4,
                      opacity: 0.9,
                      fillColor: '#10b981',
                      fillOpacity: 0.2,
                      dashArray: '10, 5'
                    };
                  } else {
                    return {
                      color: '#10b981',
                      weight: 4,
                      opacity: 0.8,
                      fillOpacity: 0.0
                    };
                  }
                },
                onEachFeature: (feature: any, layer: any) => {
                  layer.bindPopup('南水北调路线<br/>South-North Water Transfer Project');
                }
              });

              map._swntpLayer = swntpLayer;
              swntpLayer.addTo(map._overlayGroup);
            }
          } catch (swntpError) {
            console.error('Failed to load SNWTP during initial load:', swntpError);
          }
        }

        // Hide loading overlay after map is fully initialized
        setLoading(false);

        // Final size check after loading completes
        setTimeout(() => {
          try {
            if (map && map._container && map._loaded) {
              map.invalidateSize(true);
            }
          } catch (e) {
            console.warn('Could not invalidate size after loading:', e);
          }
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

  // Handle SNWTP layer toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || loading || !mapInstanceRef.current._overlayGroup) {
      return;
    }

    const map = mapInstanceRef.current;
    const loadSWNTPLayer = async () => {
      try {
        // Remove existing SNWTP layer if it exists
        if (map._swntpLayer) {
          map._overlayGroup.removeLayer(map._swntpLayer);
          map._swntpLayer = null;
        }

        // Add SNWTP layer if showSNWTP is true
        if (showSNWTP) {
          const swntpData: YellowRiverBasinData = await getSWNP();

          if (!swntpData.features || swntpData.features.length === 0) {
            console.warn('⚠️ SNWTP data is empty');
            return;
          }

          // Enhanced styling to ensure visibility
          const swntpLayer = window.L.geoJSON(swntpData, {
            style: (feature: any) => {
              // Different styles for different geometry types
              const geomType = feature?.geometry?.type;
              const isLine = geomType === 'LineString' || geomType === 'MultiLineString';
              const isPolygon = geomType === 'Polygon' || geomType === 'MultiPolygon';

              if (isLine) {
                return {
                  color: '#10b981',
                  weight: 5,
                  opacity: 1.0,
                  fillOpacity: 0.0,
                  dashArray: '10, 5'
                };
              } else if (isPolygon) {
                return {
                  color: '#10b981',
                  weight: 4,
                  opacity: 0.9,
                  fillColor: '#10b981',
                  fillOpacity: 0.2,
                  dashArray: '10, 5'
                };
              } else {
                return {
                  color: '#10b981',
                  weight: 4,
                  opacity: 0.8,
                  fillOpacity: 0.0
                };
              }
            },
            onEachFeature: (feature: any, layer: any) => {
              layer.bindPopup('南水北调路线<br/>South-North Water Transfer Project');
            }
          });

          map._swntpLayer = swntpLayer;
          swntpLayer.addTo(map._overlayGroup);

          // Fit bounds to show SNWTP route if it exists
          try {
            const bounds = swntpLayer.getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [50, 50] });
            }
          } catch (e) {
            // Silent fail - bounds fitting is optional
          }
        }
      } catch (swntpError: any) {
        console.error('❌ Failed to toggle SNWTP layer:', swntpError);
      }
    };

    loadSWNTPLayer();
  }, [showSNWTP, loading]);

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
