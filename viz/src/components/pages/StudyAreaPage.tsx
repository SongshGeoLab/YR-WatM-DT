import StudyAreaMap from '../StudyAreaMap';

export default function StudyAreaPage() {
  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
          1
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Description of the Study Area</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100%-5rem)]">
        {/* Left side - Text description */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Yangtze River Basin Overview</h3>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                The Yangtze River Basin is the largest river system in China and the third-longest river in the world.
                Covering approximately 1.8 million km², it drains about one-fifth of China's total land area.
              </p>
              <p>
                The basin supports over 400 million people and is crucial for China's economic development,
                providing water resources for agriculture, industry, and domestic use across multiple provinces.
              </p>
              <p>
                Key characteristics include diverse topography ranging from the Tibetan Plateau in the west
                to the East China Sea delta, with significant elevation changes affecting local climate and hydrology.
              </p>
            </div>
          </div>

          {/* Key Statistics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Key Basin Statistics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Length:</span>
                  <span className="font-medium">6,300 km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Drainage Area:</span>
                  <span className="font-medium">1.8M km²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Discharge:</span>
                  <span className="font-medium">31,900 m³/s</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Population:</span>
                  <span className="font-medium">~400M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Major Dams:</span>
                  <span className="font-medium">50,000+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GDP Contribution:</span>
                  <span className="font-medium">~42%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Climate Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">Climate Characteristics</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <div>• <strong>Monsoon Climate:</strong> Distinct wet and dry seasons</div>
              <div>• <strong>Annual Precipitation:</strong> 400-1,600 mm (varies by region)</div>
              <div>• <strong>Temperature Range:</strong> -10°C to 35°C (seasonal variation)</div>
              <div>• <strong>Flood Season:</strong> June to September</div>
            </div>
          </div>

          {/* Study Focus Areas */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Research Focus Areas</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Water resource availability and climate impacts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Population dynamics and water demand</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Agricultural and industrial water use</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Ecological water requirements</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Water stress and quality assessment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Interactive Map */}
        <div className="flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Interactive Basin Map</h3>
            <p className="text-sm text-gray-600">
              Explore the Yangtze River Basin with monitoring stations, major cities, and watershed boundaries.
            </p>
          </div>

          <div className="flex-1 min-h-[400px]">
            <StudyAreaMap />
          </div>

          {/* Map caption */}
          <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded p-3">
            <p>
              <strong>Interactive Map Features:</strong> Basin boundary (blue line), monitoring stations (markers),
              major urban centers (colored circles). Click on markers for detailed information about each location.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
