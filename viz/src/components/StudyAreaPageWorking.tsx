import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useEffect, useRef, useState } from 'react';
import { Layers, Download, Info, Settings, RefreshCw, BarChart3 } from 'lucide-react';
import { loadShapefileData, addShapefileToMap, SHAPEFILE_CONFIGS } from './utils/shapefileLoader';
import { BasicChart } from './charts/BasicChart';

// 模拟shapefile数据接口（后续可以替换为真实数据）
interface ShapefileLayer {
  id: string;
  name: string;
  type: 'basin' | 'rivers' | 'stations' | 'boundaries';
  visible: boolean;
  style?: any;
  data?: any; // 预留给真实shapefile数据
}

export function StudyAreaPageWorking() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedBaseLayer, setSelectedBaseLayer] = useState('satellite');
  const [shapefileLayers, setShapefileLayers] = useState<ShapefileLayer[]>([
    { id: 'yangtze-basin', name: 'Yangtze River Basin', type: 'basin', visible: true },
    { id: 'main-rivers', name: 'Main Rivers', type: 'rivers', visible: true },
    { id: 'monitoring-stations', name: 'Monitoring Stations', type: 'stations', visible: true },
    { id: 'provincial-boundaries', name: 'Provincial Boundaries', type: 'boundaries', visible: false }
  ]);
  const [isLoadingShapefiles, setIsLoadingShapefiles] = useState(false);

  // 模拟图表数据（后续替换为真实数据）
  const historicalDischargeData = [
    { label: '2020', value: 31200 },
    { label: '2021', value: 29800 },
    { label: '2022', value: 32100 },
    { label: '2023', value: 30400 },
    { label: '2024', value: 31800 }
  ];

  const stationComparisonData = [
    { label: 'Yichang', value: 31200 },
    { label: 'Wuhan', value: 28900 },
    { label: 'Datong', value: 26400 },
    { label: 'Shanghai', value: 24100 }
  ];

  // 初始化Leaflet地图
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current && typeof window !== 'undefined') {
      // 动态导入Leaflet以避免SSR问题
      import('leaflet').then((L) => {
        // 修复默认图标路径问题
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        // 初始化地图
        const map = L.map(mapRef.current!).setView([30.5, 111.5], 6);

        // 添加不同的底图图层
        const baseLayers = {
          'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }),
          'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
          }),
          'Terrain': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenTopoMap contributors'
          })
        };

        // 默认加载卫星图层
        baseLayers['Satellite'].addTo(map);

        // 添加模拟长江流域边界（简化多边形）
        const yangtzeBasinBounds = L.polygon([
          [35.0, 90.0], [35.5, 95.0], [34.0, 102.0], [32.0, 110.0],
          [31.0, 117.0], [29.5, 121.0], [27.0, 120.0], [25.0, 115.0],
          [26.0, 108.0], [28.0, 100.0], [30.0, 95.0], [33.0, 90.0], [35.0, 90.0]
        ], {
          color: '#3b82f6',
          fillColor: '#dbeafe',
          fillOpacity: 0.3,
          weight: 2
        }).addTo(map);

        yangtzeBasinBounds.bindPopup(`
          <div style="font-family: inherit;">
            <h4 style="margin: 0 0 8px 0; font-weight: 600;">Yangtze River Basin</h4>
            <p style="margin: 0; font-size: 14px;">Total Area: 1.8 million km²</p>
            <p style="margin: 4px 0 0 0; font-size: 14px;">Population: 450 million</p>
          </div>
        `);

        // 添加主要监测站点
        const stations = [
          { name: 'Yichang Station', coords: [30.7, 111.3], type: 'main' },
          { name: 'Datong Station', coords: [30.8, 117.6], type: 'main' },
          { name: 'Three Gorges Dam', coords: [30.823, 111.003], type: 'dam' },
          { name: 'Wuhan Station', coords: [30.6, 114.3], type: 'city' },
          { name: 'Shanghai Station', coords: [31.2, 121.5], type: 'city' }
        ];

        stations.forEach(station => {
          const marker = L.marker(station.coords as [number, number])
            .addTo(map)
            .bindPopup(`
              <div style="font-family: inherit;">
                <h4 style="margin: 0 0 8px 0; font-weight: 600;">${station.name}</h4>
                <p style="margin: 0; font-size: 14px;">Type: ${station.type}</p>
                <p style="margin: 4px 0 0 0; font-size: 14px;">Coordinates: ${station.coords.join(', ')}</p>
              </div>
            `);
        });

        // 添加模拟河流线条
        const mainRiver = L.polyline([
          [31.0, 91.0], [30.8, 95.0], [30.5, 100.0], [30.7, 105.0],
          [30.6, 110.0], [30.7, 111.3], [30.6, 114.3], [31.0, 117.0], [31.2, 121.0]
        ], {
          color: '#06b6d4',
          weight: 4,
          opacity: 0.8
        }).addTo(map);

        mainRiver.bindPopup(`
          <div style="font-family: inherit;">
            <h4 style="margin: 0 0 8px 0; font-weight: 600;">Yangtze River Main Stream</h4>
            <p style="margin: 0; font-size: 14px;">Length: 6,300 km</p>
            <p style="margin: 4px 0 0 0; font-size: 14px;">Average discharge: 31,900 m³/s</p>
          </div>
        `);

        mapInstanceRef.current = map;

        // 存储图层引用以便后续控制
        (map as any)._customLayers = {
          baseLayers,
          yangtzeBasinBounds,
          stations: stations.map(s => ({ ...s, marker: map })),
          mainRiver
        };
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 切换底图
  const switchBaseLayer = (layerName: string) => {
    if (mapInstanceRef.current && typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        const map = mapInstanceRef.current;
        const customLayers = (map as any)._customLayers;

        // 移除当前底图
        map.eachLayer((layer: any) => {
          if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
          }
        });

        // 添加新底图
        customLayers.baseLayers[layerName].addTo(map);
        setSelectedBaseLayer(layerName.toLowerCase());
      });
    }
  };

  // 切换shapefile图层显示状态
  const toggleShapefileLayer = (layerId: string) => {
    setShapefileLayers(prev =>
      prev.map(layer =>
        layer.id === layerId
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    );

    // TODO: 这里后续添加实际的shapefile图层控制逻辑
    console.log(`Toggle shapefile layer: ${layerId}`);
  };

  // 加载shapefile数据（示例函数）
  const loadShapefiles = async () => {
    if (!mapInstanceRef.current) return;

    setIsLoadingShapefiles(true);
    try {
      // 示例：加载长江流域shapefile
      const basinConfig = SHAPEFILE_CONFIGS.yangtzeBasin;
      const basinData = await loadShapefileData(basinConfig);

      // 添加到地图
      addShapefileToMap(mapInstanceRef.current, basinData, basinConfig);

      console.log('Shapefile data loaded successfully');
    } catch (error) {
      console.error('Failed to load shapefile data:', error);
    } finally {
      setIsLoadingShapefiles(false);
    }
  };

  return (
    <div className="h-full p-6 overflow-auto">
      <Card className="max-w-7xl mx-auto h-full p-8 border-2 border-dashed border-gray-300">
        {/* 页面标题 */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
            1
          </div>
          <h1 className="text-3xl font-bold">Description of the Study Area</h1>
        </div>

        {/* 地图控制面板 */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-gray-600" />
            <label className="text-sm font-medium">Base Layer:</label>
            <Select value={selectedBaseLayer} onValueChange={switchBaseLayer}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openstreetmap">Street Map</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3 mr-1" />
              Export Data
            </Button>
            <Button variant="outline" size="sm">
              <Info className="h-3 w-3 mr-1" />
              Map Info
            </Button>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="chart-grid-3x1 h-[calc(100vh-280px)]">
          {/* 左侧：研究区域信息和数据图表 */}
          <div className="flex flex-col gap-4">
            {/* 基本信息卡片 */}
            <Card className="p-4 bg-blue-50 border border-blue-200">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Basin Overview
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>The Yangtze River Basin, China's largest river basin, covers approximately 1.8 million km² and spans 19 provinces.</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-semibold text-blue-700">1.8M km²</div>
                    <div className="text-xs text-gray-600">Basin Area</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-semibold text-green-700">450M</div>
                    <div className="text-xs text-gray-600">Population</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 历史数据图表 */}
            <div className="flex-1">
              <BasicChart
                title="Historical Water Discharge"
                description="Water discharge data from key monitoring stations"
                data={historicalDischargeData}
                type="line"
                className="h-full"
              />
            </div>

            {/* 监测站点对比图表 */}
            <div className="flex-1">
              <BasicChart
                title="Key Monitoring Stations"
                description="Comparison of discharge rates across stations"
                data={stationComparisonData}
                type="bar"
                className="h-full"
              />
            </div>
          </div>

          {/* 中间：交互式地图区域 */}
          <div className="relative flex flex-col">
            {/* Leaflet地图容器 */}
            <div
              ref={mapRef}
              className="flex-1 rounded-lg border relative overflow-hidden shadow-lg"
              style={{ minHeight: '600px' }}
            />

            {/* 地图图例 */}
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
              <h4 className="font-medium text-sm mb-2">Map Legend</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500/30 border border-blue-500 rounded"></div>
                  <span>Basin Boundary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-cyan-500 rounded"></div>
                  <span>Main Rivers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Major Dams</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Monitoring Stations</span>
                </div>
              </div>
            </div>

            {/* 地图加载状态 */}
            {!mapInstanceRef.current && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading Interactive Map...</p>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：图层控制和设置 */}
          <div className="space-y-6">
            {/* Shapefile 图层控制面板 */}
            <Card className="p-4 bg-blue-50 border border-blue-200">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                Shapefile Layers
              </h4>
              <div className="space-y-3">
                {shapefileLayers.map((layer) => (
                  <div key={layer.id} className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={layer.visible}
                        onChange={() => toggleShapefileLayer(layer.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{layer.name}</span>
                    </label>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        layer.type === 'basin' ? 'border-blue-500 text-blue-700' :
                        layer.type === 'rivers' ? 'border-cyan-500 text-cyan-700' :
                        layer.type === 'stations' ? 'border-green-500 text-green-700' :
                        'border-gray-500 text-gray-700'
                      }`}
                    >
                      {layer.type}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadShapefiles}
                  disabled={isLoadingShapefiles}
                  className="w-full"
                >
                  {isLoadingShapefiles ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3 mr-2" />
                      Load Shapefile Data
                    </>
                  )}
                </Button>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <Info className="h-3 w-3 inline mr-1" />
                    Shapefile data will be loaded from your backend server. Configure the data source in the settings panel.
                  </p>
                </div>
              </div>
            </Card>
            {/* 预设结构指导 */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                Analysis Framework
              </h3>
              <p className="text-sm text-gray-600 mb-3">7-step comprehensive assessment</p>

              {/* 步骤指示器 */}
              <div className="space-y-2">
                <div className="text-xs text-gray-600">
                  ✓ Study Area Description<br/>
                  → Water Availability<br/>
                  → Demographics & Households<br/>
                  → Ecological Requirements<br/>
                  → Sectoral Demands<br/>
                  → Stress Assessment<br/>
                  → Quality Analysis
                </div>
              </div>
            </div>

            {/* 气候情景说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium mb-2">RCP Climate Scenarios</h4>
              <p className="text-sm text-gray-600 mb-3">Representative Concentration Pathways</p>

              {/* RCP情景 */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span>RCP2.6 - Mitigation scenario</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <span>RCP4.5 - Stabilization scenario</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <span>RCP8.5 - High emission scenario</span>
                </div>
              </div>
            </div>

            {/* 关键统计数据 */}
            <div className="space-y-3">
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="text-2xl font-bold text-blue-700">1.8M</div>
                <div className="text-sm text-blue-600">Basin Area (km²)</div>
              </Card>

              <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100">
                <div className="text-2xl font-bold text-green-700">450M</div>
                <div className="text-sm text-green-600">Population Served</div>
              </Card>

              <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100">
                <div className="text-2xl font-bold text-purple-700">46%</div>
                <div className="text-sm text-purple-600">National GDP Share</div>
              </Card>
            </div>

            {/* 数据配置面板 */}
            <Card className="p-4 bg-yellow-50 border border-yellow-200">
              <h4 className="font-medium mb-3">Data Configuration</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-gray-700 mb-1">Shapefile Server URL:</label>
                  <input
                    type="text"
                    placeholder="/api/shapefiles/"
                    className="w-full px-2 py-1 border rounded text-xs"
                    defaultValue="/api/shapefiles/"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Data Format:</label>
                  <select className="w-full px-2 py-1 border rounded text-xs">
                    <option value="shapefile">Shapefile (.shp)</option>
                    <option value="geojson">GeoJSON (.json)</option>
                    <option value="kml">KML (.kml)</option>
                  </select>
                </div>
                <div className="text-xs text-yellow-800 bg-yellow-100 p-2 rounded">
                  <strong>Next Steps:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Upload your shapefile data to the server</li>
                    <li>• Configure the API endpoints</li>
                    <li>• Test data loading functionality</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* 数据源标签 */}
            <div className="space-y-2">
              <Badge variant="outline" className="w-full justify-center">Remote Sensing 1980-2023</Badge>
              <Badge variant="outline" className="w-full justify-center">300+ Meteorological Stations</Badge>
              <Badge variant="outline" className="w-full justify-center">Hydrological Network</Badge>
              <Badge variant="outline" className="w-full justify-center">Shapefile Ready</Badge>
            </div>
          </div>
        </div>

        {/* 底部导航提示 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>1 / 7</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
