# Water Resource Decision Theater - Frontend

React + TypeScript + Vite frontend for the WatM-DT project.

## 🚀 Quick Start

```bash
# From project root
make viz-install  # Install dependencies
make viz          # Start dev server (http://localhost:5173)

# Or from viz/ directory
npm install
npm run dev
```

## 🏗️ Architecture

### Tech Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Plotly.js
- **State Management**: React Hooks
- **API Client**: Custom fetch wrapper with TypeScript types

### Project Structure

```
viz/
├── src/
│   ├── App.tsx                    # Main application & routing
│   ├── main.tsx                   # Entry point
│   ├── components/
│   │   ├── charts/
│   │   │   ├── PlotlyChart.tsx   # Reusable Plotly wrapper
│   │   │   └── BasicChart.tsx
│   │   ├── pages/                # Page components
│   │   ├── examples/             # Example components with API integration
│   │   │   └── TimeSeriesChartExample.tsx
│   │   └── ui/                   # shadcn/ui components
│   ├── services/
│   │   └── api.ts                # Backend API client
│   ├── hooks/
│   │   └── useApiData.ts         # Custom React hooks for API calls
│   └── styles/
│       └── globals.css
├── package.json
└── vite.config.ts
```

## 📡 Backend Integration

### API Endpoints

The frontend connects to FastAPI backend at `http://127.0.0.1:8000`:

- `GET /variables` - List available variables
- `GET /params` - Get parameter options
- `POST /resolve_scenario` - Resolve scenario from parameters
- `GET /time` - Get time vector
- `GET /series` - Get time series data

### Using API Client

**TypeScript API client with full type safety:**

```typescript
import * as api from '@/services/api';

// Fetch variables
const variables = await api.getVariables();

// Fetch time series
const data = await api.getSeries('YRB WSI', 'sc_0', {
  start_step: 0,
  end_step: 100
});

// Use in Plotly
<PlotlyChart
  data={[{
    x: data.series.time,
    y: data.series.value,
    type: 'scatter'
  }]}
/>
```

### Custom Hooks

**React hooks for data fetching:**

```typescript
import { useVariables, useSeries } from '@/hooks/useApiData';

function MyComponent() {
  const { data: variables, loading, error } = useVariables();
  const { data: series } = useSeries('YRB WSI', 'sc_0');

  // ... render with data
}
```

## 🎨 UI Components

### shadcn/ui Components

Pre-installed UI components in `components/ui/`:
- Buttons, Cards, Dialogs
- Select, Input, Checkbox
- Charts, Tables, Tabs
- And more...

**Usage:**
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button>Click me</Button>
  </CardContent>
</Card>
```

### Plotly Charts

**Reusable Plotly component:**

```typescript
import { PlotlyChart } from '@/components/charts/PlotlyChart';

<PlotlyChart
  id="my-chart"
  title="Water Availability"
  description="Monthly trends"
  data={[
    {
      x: [1, 2, 3, 4],
      y: [10, 15, 13, 17],
      type: 'scatter',
      mode: 'lines+markers'
    }
  ]}
  layout={{
    xaxis: { title: 'Month' },
    yaxis: { title: 'Volume (km³)' }
  }}
  height="400px"
/>
```

## 🛠️ Development

### Commands

```bash
npm run dev        # Start dev server
npm run build      # Build for production
```

### Environment Variables

Create `.env.local`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

### Hot Reload

- React components: Auto-reload ⚡
- CSS changes: Instant update
- API changes: Need backend restart

### Debugging

**Browser DevTools:**
- React DevTools extension
- Network tab for API calls
- Console for errors

**VS Code:**
- TypeScript errors inline
- ESLint warnings
- Auto-imports

## 📦 Adding Dependencies

```bash
# UI components
npm install @radix-ui/react-dialog

# Utilities
npm install date-fns

# Types
npm install -D @types/package-name
```

## 🎨 Figma Integration

This frontend is designed to sync with Figma designs. See [FIGMA_COLLABORATION_GUIDE.md](../FIGMA_COLLABORATION_GUIDE.md) for details.

**Quick workflow:**
1. Design in Figma
2. Copy node link
3. Tell Cursor AI to generate component
4. Component created with API integration

## 📊 Example Components

### TimeSeriesChartExample

Full example showing API integration:

```typescript
import { TimeSeriesChartExample } from '@/components/examples/TimeSeriesChartExample';

<TimeSeriesChartExample />
```

Features:
- Variable selection
- Scenario selection
- Loading states
- Error handling
- Plotly visualization

Add this to any page to see real backend data!

## 🚢 Deployment

### Build

```bash
make viz-build
# Output in viz/dist/
```

### Static Hosting

Deploy `viz/dist/` to:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

**Remember to set API URL:**
```env
VITE_API_URL=https://your-api-domain.com
```

## 🐛 Troubleshooting

### Frontend won't start
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### API connection failed
1. Check backend is running: `curl http://127.0.0.1:8000/`
2. Check CORS settings in `api_server.py`
3. Check browser console for errors

### Plotly not rendering
1. Check browser console for import errors
2. Verify `plotly.js-dist-min` is installed
3. Try clearing browser cache

### Build fails
```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix ESLint issues
npx eslint src/ --fix
```

## 📚 Learn More

- [React Docs](https://react.dev/)
- [Vite Guide](https://vite.dev/guide/)
- [Plotly React](https://plotly.com/javascript/react/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## 🤝 Contributing

When adding new pages:
1. Create component in `components/pages/YourPage.tsx`
2. Add to App.tsx routing
3. Integrate API calls via hooks
4. Add Plotly visualizations
5. Update navigation

## 📄 License

See [LICENSE](../LICENSE) file in project root.
