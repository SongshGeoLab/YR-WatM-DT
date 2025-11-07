import React, { useEffect, useRef, useState } from 'react';
import { getYellowRiverBasin, getSWNP, getLoessPlateau, getMainRiver, getStations, YellowRiverBasinData } from '../../services/api';

interface LeafletMapProps {
  id: string;
  className?: string;
  height?: string;
  showSNWTP?: boolean;
  showLoessPlateau?: boolean; // Always shown by default, kept for backward compatibility
  showMainRiver?: boolean; // Always shown by default, kept for backward compatibility
}

declare global {
  interface Window {
    L: any;
  }
}

export function LeafletMap({
  id,
  className = "",
  height = "400px",
  showSNWTP = false,
  showLoessPlateau = false,
  showMainRiver = false
}: LeafletMapProps) {
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
        map._loessPlateauLayer = null;
        map._mainRiverLayer = null;

        // Create a layer group for overlays
        const overlayGroup = window.L.layerGroup().addTo(map);
        map._overlayGroup = overlayGroup;

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
              fillColor: '#60a5fa',
              color: '#60a5fa',
              weight: 2,
              fillOpacity: 0.2,
              opacity: 0.5,
              dashArray: '5, 5'
            },
            onEachFeature: (feature: any, layer: any) => {
              layer.bindPopup(
                '<div style="max-width: 300px;">' +
                '<h3 style="margin: 0 0 10px 0; font-weight: bold; color: #0d47a1;">Yellow River Basin</h3>' +
                '<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">' +
                '<h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Global River Comparison</h4>' +
                '<p style="margin: 0; font-size: 13px; line-height: 1.5; color: #333;">' +
                'The Yellow River is globally famous for its exceptionally high sediment load ' +
                'relative to its water discharge. This unique characteristic distinguishes it ' +
                'from other major river systems worldwide.' +
                '</p>' +
                '</div>' +
                '</div>'
              );
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
                  layer.bindPopup('South-North Water Transfer Project');
                }
              });

              map._swntpLayer = swntpLayer;
              swntpLayer.addTo(map._overlayGroup);
            }
          } catch (swntpError) {
            console.error('Failed to load SNWTP during initial load:', swntpError);
          }
        }

        // Load Loess Plateau layer immediately if showLoessPlateau is true on initial load
        if (showLoessPlateau && map._overlayGroup) {
          try {
            const loessData: YellowRiverBasinData = await getLoessPlateau();
            if (loessData.features && loessData.features.length > 0) {
              const loessLayer = window.L.geoJSON(loessData, {
                style: (feature: any) => {
                  const geomType = feature?.geometry?.type;
                  const isPolygon = geomType === 'Polygon' || geomType === 'MultiPolygon';

                  if (isPolygon) {
                    return {
                      color: '#d97706',
                      weight: 2,
                      opacity: 0.8,
                      fillColor: '#fbbf24',
                      fillOpacity: 0.2
                    };
                  } else {
                    return {
                      color: '#d97706',
                      weight: 2,
                      opacity: 0.8,
                      fillOpacity: 0.0
                    };
                  }
                },
                onEachFeature: (feature: any, layer: any) => {
                  layer.bindPopup('Loess Plateau');
                }
              });
              map._loessPlateauLayer = loessLayer;
              loessLayer.addTo(map._overlayGroup);
            }
          } catch (loessError) {
            console.error('Failed to load Loess Plateau during initial load:', loessError);
          }
        }

        // Load Main River layer by default
        if (map._overlayGroup) {
          try {
            const riverData: YellowRiverBasinData = await getMainRiver();
            if (riverData.features && riverData.features.length > 0) {
              const riverLayer = window.L.geoJSON(riverData, {
                style: (feature: any) => {
                  const geomType = feature?.geometry?.type;
                  const isLine = geomType === 'LineString' || geomType === 'MultiLineString';

                  if (isLine) {
                    return {
                      color: '#2563eb',
                      weight: 3,
                      opacity: 0.9
                    };
                  } else {
                    return {
                      color: '#2563eb',
                      weight: 3,
                      opacity: 0.9
                    };
                  }
                },
                onEachFeature: (feature: any, layer: any) => {
                  layer.bindPopup('Yellow River Main Stream');
                }
              });
              map._mainRiverLayer = riverLayer;
              riverLayer.addTo(map._overlayGroup);
            }
          } catch (riverError) {
            console.error('Failed to load Main River during initial load:', riverError);
          }
        }

        // Load hydrologic stations
        if (map._overlayGroup) {
          try {
            const stationsData: YellowRiverBasinData = await getStations();
            if (stationsData.features && stationsData.features.length > 0) {
              // Create custom icon for stations
              const stationIcon = window.L.divIcon({
                className: 'custom-station-icon',
                html: '<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
              });

              stationsData.features.forEach((feature: any) => {
                const props = feature.properties || {};
                const geometry = feature.geometry;

                if (geometry && geometry.type === 'Point' && geometry.coordinates) {
                  const [lng, lat] = geometry.coordinates;

                  // Extract station information from properties
                  const stationName = props.NAME || props.name || props.STATION_NAME || props.station_name || 'Unknown Station';
                  const stationCode = props.CODE || props.code || props.STATION_CODE || props.station_code || '';
                  const river = props.RIVER || props.river || props.RIVER_NAME || props.river_name || '';
                  const location = props.LOCATION || props.location || props.ADDRESS || props.address || '';

                  // Build popup content
                  let popupContent = '<div style="min-width: 200px;">';
                  popupContent += `<h4 style="margin: 0 0 8px 0; font-weight: 600; color: #1e40af;">${stationName}</h4>`;

                  if (stationCode) {
                    popupContent += `<p style="margin: 4px 0; font-size: 13px;"><strong>Code:</strong> ${stationCode}</p>`;
                  }
                  if (river) {
                    popupContent += `<p style="margin: 4px 0; font-size: 13px;"><strong>River:</strong> ${river}</p>`;
                  }
                  if (location) {
                    popupContent += `<p style="margin: 4px 0; font-size: 13px;"><strong>Location:</strong> ${location}</p>`;
                  }

                  // Add any other properties that might be useful
                  Object.keys(props).forEach(key => {
                    if (!['NAME', 'name', 'STATION_NAME', 'station_name', 'CODE', 'code',
                          'STATION_CODE', 'station_code', 'RIVER', 'river', 'RIVER_NAME',
                          'river_name', 'LOCATION', 'location', 'ADDRESS', 'address'].includes(key)) {
                      const value = props[key];
                      if (value !== null && value !== undefined && value !== '') {
                        popupContent += `<p style="margin: 4px 0; font-size: 13px;"><strong>${key}:</strong> ${value}</p>`;
                      }
                    }
                  });

                  popupContent += '</div>';

                  const marker = window.L.marker([lat, lng], { icon: stationIcon })
                    .bindPopup(popupContent)
                    .addTo(map._overlayGroup);
                }
              });
            }
          } catch (stationsError) {
            console.error('Failed to load Stations during initial load:', stationsError);
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
              layer.bindPopup('South-North Water Transfer Project');
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

  // Handle Loess Plateau layer toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || loading || !mapInstanceRef.current._overlayGroup) {
      return;
    }

    const map = mapInstanceRef.current;
    const loadLoessPlateauLayer = async () => {
      try {
        // Remove existing layer if it exists
        if (map._loessPlateauLayer) {
          map._overlayGroup.removeLayer(map._loessPlateauLayer);
          map._loessPlateauLayer = null;
        }

        // Add layer if showLoessPlateau is true
        if (showLoessPlateau) {
          const loessData: YellowRiverBasinData = await getLoessPlateau();

          if (!loessData.features || loessData.features.length === 0) {
            console.warn('⚠️ Loess Plateau data is empty');
            return;
          }

          const loessLayer = window.L.geoJSON(loessData, {
            style: (feature: any) => {
              const geomType = feature?.geometry?.type;
              const isPolygon = geomType === 'Polygon' || geomType === 'MultiPolygon';

              if (isPolygon) {
                return {
                  color: '#d97706',
                  weight: 2,
                  opacity: 0.8,
                  fillColor: '#fbbf24',
                  fillOpacity: 0.2
                };
              } else {
                return {
                  color: '#d97706',
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.0
                };
              }
            },
            onEachFeature: (feature: any, layer: any) => {
              layer.bindPopup('Loess Plateau');
            }
          });

          map._loessPlateauLayer = loessLayer;
          loessLayer.addTo(map._overlayGroup);
        }
      } catch (error: any) {
        console.error('❌ Failed to toggle Loess Plateau layer:', error);
      }
    };

    loadLoessPlateauLayer();
  }, [showLoessPlateau, loading]);


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
