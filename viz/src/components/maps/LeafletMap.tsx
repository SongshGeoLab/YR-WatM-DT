import { useEffect, useRef } from 'react';

interface LeafletMapProps {
  id: string;
  className?: string;
  height?: string;
}

export function LeafletMap({ id, className = "", height = "400px" }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Placeholder for Leaflet integration
    // When you're ready to integrate Leaflet with backend data, you can add the actual map logic here
    if (mapRef.current && window.L) {
      // Example Leaflet initialization (commented out until you add Leaflet)
      // const map = L.map(mapRef.current).setView([35.0, 110.0], 6);
      // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    }
  }, []);

  return (
      <div
        ref={mapRef}
        id={id}
        className={`map-container bg-blue-50 rounded-lg flex items-center justify-center border border-gray-200 ${className}`}
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <div className="text-2xl">🗺️</div>
          <div className="font-medium text-sm mt-1">Yellow River Basin Map</div>
          <div className="text-xs text-gray-400 mt-1 leading-tight">
            Interactive geographic visualization
          </div>
        </div>
      </div>
  );
}
