import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Yellow River Basin Map Component
 * 
 * Displays an interactive map of the Yellow River Basin using Leaflet.
 * Fetches GeoJSON data from the API and renders it on the map.
 */
interface YellowRiverBasinMapProps {
  /** Optional CSS class name */
  className?: string;
  /** API base URL, defaults to localhost:8000 */
  apiUrl?: string;
}

export default function YellowRiverBasinMap({ 
  className = '', 
  apiUrl = 'http://localhost:8000' 
}: YellowRiverBasinMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map
    const map = L.map(mapRef.current, {
      center: [36.5, 110], // Yellow River Basin approximate center
      zoom: 6,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapInstanceRef.current = map;

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Fetch and add GeoJSON layer
    fetch(`${apiUrl}/basin/geojson`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(geojson => {
        setLoading(false);
        
        // Add GeoJSON layer with custom styling
        const geoJsonLayer = L.geoJSON(geojson, {
          style: {
            fillColor: '#3186cc',
            color: '#0d47a1',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.2
          },
          onEachFeature: (feature, layer) => {
            // Add popup or tooltip if needed
            if (feature.properties && feature.properties.name) {
              layer.bindPopup(`<b>${feature.properties.name}</b>`);
            } else {
              layer.bindPopup('<b>黄河流域 (Yellow River Basin)</b>');
            }
          }
        }).addTo(map);

        // Fit map to the basin bounds
        const bounds = geoJsonLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      })
      .catch(err => {
        console.error('Error loading basin GeoJSON:', err);
        setError(err.message);
        setLoading(false);
      });

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [apiUrl]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 rounded-lg">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm text-gray-600">加载地图数据中...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 rounded-lg">
          <div className="text-center p-4">
            <p className="text-sm text-red-600">加载失败: {error}</p>
            <p className="text-xs text-gray-500 mt-2">请确保 API 服务器正在运行</p>
          </div>
        </div>
      )}

      {/* Map legend */}
      {!loading && !error && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs z-[1000]">
          <h4 className="font-semibold text-sm mb-2">黄河流域</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 border-2 border-[#0d47a1] bg-[#3186cc]/20 rounded-sm"></div>
              <span>流域边界</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

