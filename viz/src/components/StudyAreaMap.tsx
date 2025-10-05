import { useState } from 'react';

export default function StudyAreaMap() {
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Simulate map interaction
  const handleMapClick = () => {
    console.log('Map area clicked - would show location details in real implementation');
  };

  return (
    <div className="relative w-full h-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-blue-50">
      {/* Static map representation */}
      <div
        className="w-full h-full cursor-pointer relative bg-gradient-to-br from-blue-100 to-green-100"
        style={{ minHeight: '400px' }}
        onClick={handleMapClick}
      >
        {/* River representation */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
          {/* Yangtze River main channel */}
          <path
            d="M50 150 Q120 140 200 145 Q280 150 350 155"
            stroke="#2563eb"
            strokeWidth="4"
            fill="none"
            opacity="0.8"
          />

          {/* Tributaries */}
          <path d="M100 120 Q120 130 140 145" stroke="#3b82f6" strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M180 130 Q200 140 220 150" stroke="#3b82f6" strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M260 140 Q280 145 300 155" stroke="#3b82f6" strokeWidth="2" fill="none" opacity="0.6" />

          {/* Basin boundary (simplified) */}
          <polygon
            points="30,100 80,80 150,85 250,90 350,95 380,120 370,200 320,220 250,215 150,210 80,205 40,180"
            fill="#3b82f6"
            fillOpacity="0.1"
            stroke="#2563eb"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Major cities */}
          <circle cx="320" cy="160" r="6" fill="#dc2626" opacity="0.8" />
          <text x="330" y="165" fontSize="10" fill="#dc2626" fontWeight="bold">Shanghai</text>

          <circle cx="220" cy="150" r="5" fill="#059669" opacity="0.8" />
          <text x="230" y="155" fontSize="10" fill="#059669" fontWeight="bold">Wuhan</text>

          <circle cx="140" cy="165" r="5" fill="#7c3aed" opacity="0.8" />
          <text x="150" y="170" fontSize="10" fill="#7c3aed" fontWeight="bold">Chongqing</text>

          <circle cx="280" cy="145" r="4" fill="#ea580c" opacity="0.8" />
          <text x="290" y="150" fontSize="10" fill="#ea580c" fontWeight="bold">Nanjing</text>

          {/* Monitoring stations */}
          <rect x="165" y="145" width="6" height="6" fill="#374151" opacity="0.8" />
          <text x="175" y="150" fontSize="8" fill="#374151">Yichang</text>

          <rect x="215" y="148" width="6" height="6" fill="#374151" opacity="0.8" />
          <text x="225" y="153" fontSize="8" fill="#374151">Hankou</text>

          <rect x="285" y="150" width="6" height="6" fill="#374151" opacity="0.8" />
          <text x="295" y="155" fontSize="8" fill="#374151">Datong</text>

          {/* Three Gorges Dam */}
          <polygon points="160,140 170,140 165,150" fill="#6b7280" opacity="0.9" />
          <text x="170" y="145" fontSize="8" fill="#6b7280" fontWeight="bold">Three Gorges</text>
        </svg>

        {/* Loading indicator */}
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div className="text-sm text-gray-600">Interactive Map View</div>
              <div className="text-xs text-gray-500 mt-1">(Leaflet integration ready)</div>
            </div>
          </div>
        )}
      </div>

      {/* Map overlay info */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
        <h4 className="font-semibold text-sm mb-2">Yangtze River Basin</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>• Total Area: ~1.8M km²</div>
          <div>• Length: ~6,300 km</div>
          <div>• Population: ~400M people</div>
          <div>• Major Tributaries: Han, Min, Jialing</div>
        </div>
      </div>

      {/* Interactive controls hint */}
      <div className="absolute bottom-4 left-4 bg-blue-50 border border-blue-200 rounded-lg p-2">
        <div className="text-xs text-blue-800">
          <div>🗺️ Static map representation</div>
          <div>📍 Major cities and monitoring stations</div>
          <div>🔗 Ready for Leaflet integration</div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-600"></div>
            <span>Basin Boundary</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-600 rounded-sm"></div>
            <span>Monitoring Station</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span>Major Cities</span>
          </div>
        </div>
      </div>
    </div>
  );
}
