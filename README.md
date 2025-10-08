# WatM-DT

**Water Management Decision Theater** - 水资源管理决策剧场

An interactive data visualization platform for water resource analysis, featuring a FastAPI backend and React frontend with real-time Plotly visualizations.

## 🎯 Features

- 📊 **Interactive Visualizations** - Plotly-based charts for time series, spatial analysis
- 🔄 **Real-time Data API** - FastAPI server with Parquet-backed data storage
- 🎨 **Modern UI** - React + TypeScript + Tailwind CSS + shadcn/ui
- 🎭 **Figma Integration** - Direct sync with Figma designs via MCP
- 📈 **Scenario Analysis** - Multi-parameter scenario exploration
- 🌊 **Water Resource Metrics** - WSI, availability, demand, quality analysis

## 🚀 Quick Start

### Full-Stack Development (Recommended)

```bash
# Install dependencies
poetry install
cd viz && npm install && cd ..

# Start both backend API and frontend dev server
make dev
```

This starts:
- Backend API: http://127.0.0.1:8000
- Frontend: http://localhost:5173
- API Docs: http://127.0.0.1:8000/docs

### Step-by-Step Setup

```bash
# 1. Data preprocessing (first time only)
make preprocess

# 2. Start backend API
make api

# 3. Start frontend (in another terminal)
make viz
```

## 📁 Project Structure

```
WatM-DT/
├── scripts/
│   ├── api_server.py              # FastAPI backend server
│   ├── dash_app.py                # Dash visualization (alternative)
│   └── preprocess_to_parquet.py   # Data preprocessing
├── viz/                            # React frontend
│   ├── src/
│   │   ├── App.tsx                # Main application
│   │   ├── components/            # UI components
│   │   ├── services/api.ts        # Backend API client
│   │   └── hooks/useApiData.ts    # React hooks for data
│   └── package.json
├── data/                           # Source CSV data
├── data_parquet/                   # Processed Parquet data
├── makefile                        # Development commands
├── WORKFLOW.md                     # Detailed workflow guide
└── FIGMA_COLLABORATION_GUIDE.md   # Figma integration guide
```

## 🔧 Development Commands

```bash
# Data preprocessing
make preprocess              # Convert CSV to Parquet

# Development
make dev                     # Start backend + frontend
make api                     # Start backend only
make viz                     # Start frontend only
make dash                    # Start Dash app (alternative UI)

# Build
make viz-build              # Build frontend for production

# Cleanup
make clean-dev              # Stop all dev servers
make kill-port PORT=8000    # Kill process on specific port
make kill-vite              # Kill frontend dev servers
```

## 🎨 Figma Integration

This project supports direct integration with Figma via Model Context Protocol (MCP).

**Benefits:**
- ✅ Real-time design sync
- ✅ Auto-generate React components from designs
- ✅ No manual copy-paste needed

**Usage:**

```
Tell Cursor AI:
"Create a new WaterQuality page from Figma node-id=123:456"
```

See [FIGMA_COLLABORATION_GUIDE.md](./FIGMA_COLLABORATION_GUIDE.md) for detailed instructions.

## 📡 API Documentation

### Backend Endpoints

**Base URL:** http://127.0.0.1:8000

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/variables` | GET | List available variables |
| `/params` | GET | Get parameter options |
| `/resolve_scenario` | POST | Resolve scenario from parameters |
| `/time` | GET | Get time vector |
| `/series` | GET | Get time series data |

**Interactive Docs:** http://127.0.0.1:8000/docs (when API is running)

### Frontend API Client

```typescript
import * as api from '@/services/api';

// Fetch variables
const variables = await api.getVariables();

// Fetch time series
const data = await api.getSeries('YRB WSI', 'sc_0', {
  start_step: 0,
  end_step: 100
});
```

See [viz/README.md](./viz/README.md) for frontend documentation.

## 📊 Data Flow

```
CSV/Excel Data
    ↓ make preprocess
Parquet Files (data_parquet/)
    ↓ make api
FastAPI Server (:8000)
    ↓ HTTP/JSON
React Frontend (:5173)
    ↓ Plotly Charts
User Browser
```

## 🎯 Example Usage

### 1. View Interactive Visualizations

```bash
make dev
# Open http://localhost:5173
```

### 2. Query API Directly

```bash
# Get available variables
curl http://127.0.0.1:8000/variables

# Get time series data
curl "http://127.0.0.1:8000/series?variable=YRB%20WSI&scenario=sc_0"
```

### 3. Integrate API in Components

```typescript
import { useSeries } from '@/hooks/useApiData';

function MyComponent() {
  const { data, loading, error } = useSeries('YRB WSI', 'sc_0');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <PlotlyChart data={[{
    x: data.series.time,
    y: data.series.value,
    type: 'scatter'
  }]} />;
}
```

## 🤝 Collaboration Workflow

### Working with Cursor AI + Figma MCP

**Recommended approach:**

1. **Design in Figma**
   - Create or update designs
   - Copy node link (right-click → Copy link to selection)

2. **Tell Cursor AI**
   ```
   Create/update [Component] from Figma:
   https://figma.com/design/xxx?node-id=123-456

   Requirements:
   - [Feature 1]
   - [API integration needs]
   - [Special behaviors]
   ```

3. **AI handles everything**
   - Fetches Figma design
   - Generates React component
   - Integrates API calls
   - Adds to routing

See [WORKFLOW.md](./WORKFLOW.md) for detailed development workflows.

## 📚 Documentation

- [WORKFLOW.md](./WORKFLOW.md) - Complete development workflow guide
- [FIGMA_COLLABORATION_GUIDE.md](./FIGMA_COLLABORATION_GUIDE.md) - Figma integration
- [viz/README.md](./viz/README.md) - Frontend documentation
- [API Docs](http://127.0.0.1:8000/docs) - Interactive API documentation

## 🛠️ Tech Stack

### Backend
- **Python 3.11+** with Poetry
- **FastAPI** - Modern async web framework
- **Polars** - Fast DataFrame library
- **Parquet** - Columnar storage format
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite 6** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Plotly.js** - Interactive charts

### Integration
- **Figma MCP** - Design sync
- **CORS enabled** - Cross-origin requests

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check port availability
make kill-port PORT=8000

# Reinstall dependencies
poetry install

# Verify data is preprocessed
ls data_parquet/
```

### Frontend can't connect to API
1. Verify backend is running: `curl http://127.0.0.1:8000/`
2. Check CORS settings in `api_server.py`
3. Check browser console for errors

### Figma MCP not working
1. Ensure Figma Desktop app is running (not browser)
2. Verify MCP configuration in Cursor settings
3. Check you have access to the Figma file

### Full cleanup and restart
```bash
make clean-dev
make preprocess
make dev
```

## 📄 License

See [LICENSE](./LICENSE) file.

## 🙏 Acknowledgments

- Yellow River Basin data sources
- Plotly for visualization library
- FastAPI for the excellent web framework
- shadcn/ui for beautiful components

---

**Ready to start?** Run `make dev` and open http://localhost:5173 🚀
