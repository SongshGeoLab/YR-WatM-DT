import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  MapPin,
  Droplets,
  Users,
  Leaf,
  Factory,
  AlertTriangle,
  FlaskConical,
  ChevronRight
} from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

const navigationItems = [
  {
    id: 'study-area',
    title: 'Study Area Description',
    icon: MapPin,
    description: 'Basin overview and data foundation',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'water-availability',
    title: 'Surface Water Availability',
    icon: Droplets,
    description: 'Water resources under climate scenarios',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50'
  },
  {
    id: 'demography',
    title: 'Demography & Households',
    icon: Users,
    description: 'Population growth and water demand',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'ecological-water',
    title: 'Ecological Water Use',
    icon: Leaf,
    description: 'Environmental flow requirements',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'agriculture-industry',
    title: 'Agriculture & Industry',
    icon: Factory,
    description: 'Water use structure and efficiency',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'water-stress',
    title: 'Water Stress',
    icon: AlertTriangle,
    description: 'Stress index and risk assessment',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  {
    id: 'water-sediment',
    title: 'Water Quality & Sediment',
    icon: FlaskConical,
    description: 'Water quality monitoring and sediment analysis',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  }
];

export function Navigation({ currentTab, onTabChange, children }: NavigationProps) {
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);

  const currentItem = navigationItems.find(item => item.id === currentTab);

  return (
    <div className="layout-16-9 grid-16-9 bg-gray-50">
      {/* 侧边栏导航 */}
      <div className={`${collapsedSidebar ? 'w-16' : 'aspect-16-9-sidebar'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
        {/* 标题栏 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!collapsedSidebar && (
              <div>
                <h1 className="font-medium">Water Resources Visualization</h1>
                <p className="text-sm text-muted-foreground">Basin Analysis Platform</p>
              </div>
            )}
            <button
              onClick={() => setCollapsedSidebar(!collapsedSidebar)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${collapsedSidebar ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>

        {/* 导航菜单 */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? `${item.bgColor} ${item.color} border border-current/20`
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  title={collapsedSidebar ? item.title : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? item.color : 'text-gray-500'}`} />
                    {!collapsedSidebar && (
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 底部信息 */}
        {!collapsedSidebar && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-muted-foreground">
              <p>Version: v1.0.0</p>
              <p>Data Update: March 2024</p>
            </div>
          </div>
        )}
      </div>

      {/* 主内容区域 */}
      <div className="aspect-16-9-content flex flex-col min-w-0">
        {/* 面包屑导航 */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 h-16 flex items-center">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {currentItem && (
                <>
                  <currentItem.icon className={`h-5 w-5 ${currentItem.color}`} />
                  <h2 className="font-medium">{currentItem.title}</h2>
                  <Badge variant="outline" className="ml-2">
                    {navigationItems.findIndex(item => item.id === currentTab) + 1} / {navigationItems.length}
                  </Badge>
                </>
              )}
            </div>
          </div>
          {currentItem && (
            <p className="text-sm text-muted-foreground mt-1">
              {currentItem.description}
            </p>
          )}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
