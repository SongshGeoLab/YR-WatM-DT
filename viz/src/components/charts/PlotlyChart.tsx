import { useEffect, useRef } from 'react';
// Dynamic import of Plotly to avoid bundler resolution issues
type Config = any;
type Data = any;
type Layout = any;

type Props = {
  id: string;
  title?: string;
  description?: string;
  height?: string | number; // e.g., '400px' or 400
  data: Data[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  className?: string;
};

export function PlotlyChart({
  id,
  title,
  description,
  height = '400px',
  data,
  layout,
  config,
  className,
}: Props) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const target = chartRef.current;

    (async () => {
      // Try dist-min first; fallback to dist
      let Plotly: any;
      try {
        Plotly = (await import('plotly.js-dist-min')).default;
      } catch {
        Plotly = (await import('plotly.js-dist')).default;
      }
      await Plotly.newPlot(
        target,
        data,
        {
          margin: { l: 40, r: 20, t: 20, b: 40 },
          ...layout,
        },
        {
          responsive: true,
          displaylogo: false,
          ...config,
        }
      );
    })();

    return () => {
      (async () => {
        try {
          const P = (await import('plotly.js-dist-min')).default;
          P.purge(target);
        } catch {
          try {
            const P2 = (await import('plotly.js-dist')).default;
            P2.purge(target);
          } catch {
            // ignore
          }
        }
      })();
    };
  }, [JSON.stringify(data), JSON.stringify(layout), JSON.stringify(config)]);

  return (
    <div className={className}>
      {(title || description) && (
        <div className="mb-2">
          {title && <h3 className="font-semibold">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div id={id} ref={chartRef} style={{ width: '100%', height }} />
    </div>
  );
}
