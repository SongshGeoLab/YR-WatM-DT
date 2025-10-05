// Shapefile数据加载工具
// 为后续集成真实shapefile数据预留接口

export interface ShapefileData {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: {
    type: 'Polygon' | 'LineString' | 'Point' | 'MultiPolygon' | 'MultiLineString';
    coordinates: any[];
  };
}

export interface ShapefileLoadOptions {
  url: string;
  layerName: string;
  style?: {
    color?: string;
    fillColor?: string;
    weight?: number;
    opacity?: number;
    fillOpacity?: number;
  };
}

// 模拟shapefile数据加载函数（后续替换为真实实现）
export async function loadShapefileData(options: ShapefileLoadOptions): Promise<ShapefileData> {
  try {
    // TODO: 替换为真实的shapefile加载逻辑
    // 可以使用 shpjs 库或后端API
    console.log(`Loading shapefile from: ${options.url}`);

    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 返回模拟数据结构
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            name: options.layerName,
            id: Date.now()
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [110.0, 30.0],
              [115.0, 30.0],
              [115.0, 32.0],
              [110.0, 32.0],
              [110.0, 30.0]
            ]]
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error loading shapefile:', error);
    throw new Error(`Failed to load shapefile: ${options.url}`);
  }
}

// 添加shapefile图层到Leaflet地图
export function addShapefileToMap(map: any, data: ShapefileData, options: ShapefileLoadOptions) {
  if (typeof window !== 'undefined') {
    import('leaflet').then((L) => {
      const layer = L.geoJSON(data, {
        style: options.style || {
          color: '#3b82f6',
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.3
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            // 添加弹窗信息
            const popupContent = Object.entries(feature.properties)
              .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
              .join('<br>');
            layer.bindPopup(popupContent);
          }
        }
      }).addTo(map);

      return layer;
    });
  }
}

// 预定义的shapefile配置
export const SHAPEFILE_CONFIGS = {
  yangtzeBasin: {
    url: '/api/shapefiles/yangtze-basin.shp', // 后续配置真实路径
    layerName: 'Yangtze River Basin',
    style: {
      color: '#3b82f6',
      fillColor: '#dbeafe',
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.3
    }
  },
  rivers: {
    url: '/api/shapefiles/rivers.shp',
    layerName: 'River Network',
    style: {
      color: '#06b6d4',
      weight: 3,
      opacity: 0.8
    }
  },
  stations: {
    url: '/api/shapefiles/monitoring-stations.shp',
    layerName: 'Monitoring Stations',
    style: {
      color: '#22c55e',
      fillColor: '#22c55e',
      radius: 6,
      opacity: 1,
      fillOpacity: 0.8
    }
  },
  boundaries: {
    url: '/api/shapefiles/provincial-boundaries.shp',
    layerName: 'Provincial Boundaries',
    style: {
      color: '#6b7280',
      weight: 1,
      opacity: 0.6,
      fillOpacity: 0.1
    }
  }
};

// 数据格式验证
export function validateShapefileData(data: any): data is ShapefileData {
  return (
    data &&
    typeof data === 'object' &&
    data.type === 'FeatureCollection' &&
    Array.isArray(data.features)
  );
}
