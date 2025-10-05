import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

export interface BasicChartProps {
  title: string;
  description?: string;
  data: { label: string; value: number }[];
  type?: 'bar' | 'line';
  className?: string;
}

export function BasicChart({
  title,
  description,
  data,
  type = 'bar',
  className = ""
}: BasicChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card className={`p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className="h-64 relative">
        {type === 'bar' ? (
          <div className="flex items-end justify-between h-full gap-2 p-4">
            {data.map((item, index) => (
              <div key={index} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className="bg-blue-500 rounded-t-sm min-w-[16px] transition-all hover:bg-blue-600"
                  style={{
                    height: `${(item.value / maxValue) * 80}%`,
                    minHeight: '4px'
                  }}
                  title={`${item.label}: ${item.value}`}
                />
                <span className="text-xs text-center">{item.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative h-full p-4">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <polyline
                points={data.map((item, index) =>
                  `${(index / (data.length - 1)) * 100},${100 - (item.value / maxValue) * 80}`
                ).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {data.map((item, index) => (
                <circle
                  key={index}
                  cx={(index / (data.length - 1)) * 100}
                  cy={100 - (item.value / maxValue) * 80}
                  r="2"
                  fill="#3b82f6"
                  vectorEffect="non-scaling-stroke"
                >
                  <title>{`${item.label}: ${item.value}`}</title>
                </circle>
              ))}
            </svg>
          </div>
        )}
      </div>

      <div className="mt-2">
        <Badge variant="outline" className="text-xs">
          Data Visualization
        </Badge>
      </div>
    </Card>
  );
}
