# Yellow River Basin Water Resource Management Decision Theater - User Guide

## 📖 Project Introduction

This is an interactive data visualization platform showcasing future scenarios of water resource management in the Yellow River Basin. By adjusting different parameter combinations, you can explore multiple water management scenarios from 2020 to 2100, providing scientific basis for decision-making.

![Website Demo](https://songshgeo-picgo-1302043007.cos.ap-beijing.myqcloud.com/uPic/CleanShot%202025-10-11%20at%2010.10.46@2x.png)

### Core Features

- **7 Thematic Pages**: Comprehensive analysis from study area to water quality
- **Multi-Parameter Scenarios**: Over 4700 parameter combination scenarios
- **Time Series Forecasting**: Long-term trend analysis from 2020 to 2100
- **Interactive Visualization**: Real-time parameter adjustment with instant results
- **Dark Mode**: Eye-friendly dark theme support

---

## 🚀 Quick Start

### Accessing the Application

1. **Start Backend Service** (Technical staff operation)
   ```bash
   make api
   # Service runs at http://127.0.0.1:8000
   ```

2. **Start Frontend Application** (Technical staff operation)
   ```bash
   cd viz
   npm install
   npm run dev
   # Application runs at http://localhost:3000
   ```

3. **Open Browser**
   - Visit the displayed address in your browser (usually `http://localhost:3000`)
   - Recommended browsers: Chrome, Firefox, or Edge

---

## 🎨 Interface Navigation

### Main Interface Layout

```
┌─────────────────────────────────────────────────────────┐
│  🏞️ Yellow River Basin Water Resource Analysis        │
│  Interactive Data Visualization & Scenario Analysis    │
│                                       [2020-2100]       │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │              Main Content Area               │
│          │                                              │
│  ☐ Page1 │        • Charts                              │
│  ☐ Page2 │        • Parameter Controls                  │
│  ☐ Page3 │        • Statistics                          │
│  ...     │        • Descriptions                        │
│          │                                              │
│  [🌙]    │                                              │
│  [📄]    │                                              │
│  [💻]    │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### Top Bar

- **Title**: Displays application name "Yellow River Basin Water Resource Analysis"
- **Time Range Label**: Shows current analysis timespan "2020-2100 Projection"

### Left Sidebar Navigation

Contains navigation buttons for 7 thematic pages:
1. 🗺️ **Study Area** - Research Area
2. 🌧️ **Water Availability** - Water Resource Availability
3. 👥 **Demographics** - Population Demographics
4. 🌲 **Ecological Water** - Ecological Water Use
5. 🌾 **Agriculture** - Agricultural Water Use
6. 📊 **Water Stress** - Water Resource Stress
7. 🔬 **Water Quality** - Water Quality

### Bottom Toolbar

- **🌙/☀️ Theme Toggle**: Switch between dark and light modes
- **📄 Research Paper**: Link to related academic papers
- **💻 Code Repository**: Access project source code

---

## 📄 Detailed Page Descriptions

### 1. Study Area

**Function**: Displays the geographical location, basin extent, and key features of the Yellow River Basin.

**Content**:
- Study area map
- Basin basic information
- Hydrological station distribution
- Administrative divisions

**Usage Tips**: This page is primarily for understanding research background; no parameter adjustment needed.

---

### 2. Water Availability

**Function**: Shows water resource availability predictions under different climate change scenarios.

**Adjustable Parameters**:
- **Climate Change Scenario** (Climate change scenario switch for water yield)
  - Scenario 1: RCP2.6-SSP1 (Low emissions)
  - Scenario 2: RCP4.5-SSP2 (Medium emissions)
  - Scenario 3: RCP8.5-SSP5 (High emissions)

**Main Variables**:
- YRB available surface water
- hydrologic station discharge[lijin]

**How to Use**:
1. Click different climate scenario buttons
2. Observe changes in water resource availability trends
3. Compare differences under various scenarios

**Interpretation Tips**:
- Higher emission scenarios (RCP8.5) typically lead to greater water resource fluctuations
- Focus on years when peaks and valleys occur

---

### 3. Demographics

**Function**: Shows population change trends and their impact on water resource demand.

**Adjustable Parameters**:
- **Fertility Rate** (Fertility Variation): 1.6 ~ 1.8
  - Adjust via slider
  - Affects future population growth rate
- **Diet Pattern** (Diet change scenario switch)
  - Scenario 1: Traditional diet
  - Scenario 2: Transitional diet
  - Scenario 3: Healthy diet

**Main Variables**:
- Total population
- domestic water demand province sum
- GDP per capita

**How to Use**:
1. Drag fertility rate slider to view population forecast changes
2. Select different diet patterns
3. Observe impact on domestic water demand

**Interpretation Tips**:
- Higher fertility rate means more future population and greater water demand
- Diet patterns affect agricultural water demand

---

### 4. Ecological Water ⭐

**Function**: Analyzes the impact of ecological water flow proportion on basin ecological environment.

> 💡 **Note**: This is a fully integrated interactive page showcasing complete parameter adjustment functionality.

**Adjustable Parameters**:
- **Ecological Water Flow Ratio** (Ecological water flow variable)
  - Range: 0.2 ~ 0.3
  - Recommended: 0.25
  - Adjust via slider or quick buttons

**Main Variables**:
- YRB available surface water
- hydrologic station discharge[lijin]
- sediment load[lijin]

**How to Use**:
1. **Adjust Parameters**:
   - Method 1: Drag slider for continuous adjustment
   - Method 2: Click quick buttons (0.2 / 0.25 / 0.3)
2. **Switch Variables**: Click variable buttons above to view different indicators
3. **View Statistics**: Chart displays mean, max, min values and corresponding years below
4. **Analyze Trends**: Observe long-term changes under different ecological flows

**Interpretation Tips**:
- Higher ecological flow means better ecological protection but less available water
- Monitor sediment load changes, closely related to river health
- Note years when peaks occur, possibly corresponding to extreme climate events

**Statistics Explanation**:
- **Mean (2020-2100)**: Average value over the time period
- **Max Value**: Maximum value and year of occurrence
- **Min Value**: Minimum value and year of occurrence
- **Scenario**: Scenario number corresponding to current parameter combination

---

### 5. Agriculture

**Function**: Shows agricultural water demand and the impact of water-saving irrigation technology.

**Adjustable Parameters**:
- **Water-Saving Irrigation Efficiency** (water-saving irrigation efficiency ratio)
  - Range: 0.8 ~ 1.0
  - Higher values indicate better water conservation
- **Fire Generation Share Target** (fire generation share province target)
  - Range: 0.1 ~ 0.4
  - Affects industrial water demand

**Main Variables**:
- irrigation water demand province sum
- production water demand province sum

**How to Use**:
1. Adjust water-saving irrigation efficiency slider
2. Set fire generation share
3. Observe changes in agricultural and industrial water use

**Interpretation Tips**:
- Improving irrigation efficiency can significantly reduce agricultural water demand
- Reducing thermal power share helps decrease industrial water consumption

---

### 6. Water Stress

**Function**: Evaluates water stress index and supply-demand balance status.

**Main Variables**:
- YRB WSI (Yellow River Basin Water Stress Index)
- water consumption of province in YRB sum

**Stress Levels**:
- WSI < 0.2: Low stress
- 0.2 ≤ WSI < 0.4: Medium stress
- 0.4 ≤ WSI < 0.6: High stress
- WSI ≥ 0.6: Very high stress

**How to Use**:
1. Integrate all parameters set on previous pages
2. View changes in water stress index
3. Identify high-risk periods

**Interpretation Tips**:
- Pay attention to periods when WSI exceeds 0.4, requiring special attention
- Combine parameter adjustments from other pages to find scenarios that reduce water stress

---

### 7. Water Quality

**Function**: Shows water quality indicators and pollutant change trends.

**Main Variables**:
- Comprehensive water quality indicators
- Pollutant concentration changes

**How to Use**:
1. View water quality predictions under different scenarios
2. Focus on pollutant peak periods
3. Analyze effectiveness of water quality improvement measures

**Interpretation Tips**:
- Water quality is affected by multiple factors, including industrial emissions and agricultural non-point source pollution
- Focus on long-term trends rather than short-term fluctuations

---

## 🎛️ Parameter System Explained

### Parameter Types

Our system includes 6 adjustable parameters, jointly defining 4725 scenario combinations:

| Parameter Name | English Name | Value Range | Affecting Page |
|---------------|--------------|-------------|----------------|
| Fertility Variation | Fertility Variation | 1.6, 1.65, 1.7, 1.75, 1.8 | Demographics |
| Water-Saving Irrigation Efficiency | water-saving irrigation efficiency ratio | 0.8, 0.85, 0.9, 0.95, 1.0 | Agriculture |
| Fire Generation Share Target | fire generation share province target | 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4 | Agriculture |
| Ecological Flow Variable | Ecological water flow variable | 0.2, 0.25, 0.3 | Ecological Water |
| Climate Change Scenario | Climate change scenario switch | 1, 2, 3 | Water Availability |
| Diet Change Scenario | Diet change scenario switch | 1, 2, 3 | Demographics |

### Scenario Query Mechanism

**Scenario IDs**: System auto-generates `sc_0` to `sc_4724` (4725 scenarios total)

**Query Logic**:
1. **Fully Determined**: When all 6 parameters are set, system matches to a unique scenario
2. **Partially Determined**: When only some parameters are set, system returns all matching scenarios
3. **Confidence Intervals**: Multi-scenario data can be displayed as time series + confidence intervals

**Example**:
```
Settings: Climate scenario=1, Fertility=1.6, other parameters unset
Result: Returns multiple matching scenarios, chart shows mean and bounds
```

### Parameter Linkage

Parameter selections between pages are linked:

```
Page 2 (Climate scenario) → Narrow possible scenario range
    ↓
Page 3 (Population+Diet) → Further narrow range
    ↓
Page 4 (Ecological flow) → Continue narrowing
    ↓
Page 5 (Agriculture params) → Determine unique scenario
    ↓
Page 6, 7 → Display results using determined scenario
```

**Best Practices**:
1. Start setting parameters from Page 2 sequentially
2. Observe changes after each parameter adjustment
3. Check comprehensive water stress index on Page 6
4. Adjust parameters based on results to find optimal solution

---

## 📊 Variable Descriptions

### Variable Name Mapping

System uses two variable name systems:

**Original Names** (for display) → **Safe Names** (for queries)

```
hydrologic station discharge[lijin]           → hydrologic_station_discharge_lijin
YRB available surface water                   → yrb_available_surface_water
sediment load[lijin]                          → sediment_load_lijin
irrigation water demand province sum          → irrigation_water_demand_province_sum
production water demand province sum          → production_water_demand_province_sum
OA water demand province sum                  → oa_water_demand_province_sum
domestic water demand province sum            → domestic_water_demand_province_sum
GDP per capita                                → gdp_per_capita
Total population                              → total_population
YRB WSI                                       → yrb_wsi
water consumption of province in YRB sum      → water_consumption_of_province_in_yrb_sum
```

### Complete Variable List

1. **GDP per capita** - GDP per capita
2. **OA water demand province sum** - Other industries water demand sum
3. **Total population** - Total population
4. **YRB WSI** - Yellow River Basin Water Stress Index
5. **YRB available surface water** - Yellow River Basin available surface water
6. **domestic water demand province sum** - Domestic water demand sum
7. **hydrologic station discharge[lijin]** - Lijin hydrological station discharge
8. **irrigation water demand province sum** - Irrigation water demand sum
9. **production water demand province sum** - Production water demand sum
10. **sediment load[lijin]** - Sediment load at Lijin station
11. **water consumption of province in YRB sum** - Provincial water consumption sum

---

## 💡 Usage Tips

### Scenario Exploration Suggestions

**Beginners**:
1. First browse Page 1 to understand study area
2. Experience parameter adjustment on Page 4 (Ecological Water)
3. Observe real-time chart changes when moving slider
4. View statistics panel to understand data characteristics

**Intermediate Users**:
1. Visit Pages 2-5 sequentially, gradually setting parameters
2. Check comprehensive water stress index on Page 6
3. Try adjusting parameters to find scenario combinations with lower WSI
4. Record optimal parameter combinations

**Advanced Users**:
1. Design comparison experiments: fix most parameters, change only one
2. Analyze impact magnitude of individual parameters
3. Explore extreme scenarios (e.g., high emissions + high population + low water conservation)
4. Export data for further analysis

### Chart Reading Skills

**Trend Analysis**:
- Upward trend: Problems may worsen
- Downward trend: Situation may improve
- Fluctuations: Influenced by cyclical factors

**Key Point Identification**:
- Peak years: Potential crisis periods
- Valley years: Relatively safe periods
- Inflection points: Critical nodes of trend changes

**Comparative Analysis**:
- Change magnitude before and after parameter adjustment
- Correlations between different variables
- Confidence interval width under multiple scenarios

### Theme Mode Selection

**Light Mode** (default):
- Suitable for daytime use
- Print-friendly
- High chart contrast

**Dark Mode**:
- Reduces eye strain
- Suitable for extended use
- Saves device power

Toggle method: Click 🌙/☀️ button in lower left corner

---

## ❓ Frequently Asked Questions

### Q1: Why doesn't the chart change after adjusting parameters?

**Possible Causes**:
1. Backend service not started
2. Parameter value not in valid range
3. Browser cache issue

**Solutions**:
1. Check if backend is running (visit http://127.0.0.1:8000/docs)
2. Confirm parameter value is within list range
3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Q2: How to know which scenario is current?

**Answer**: In the statistics panel below the chart, the **Scenario** field displays current scenario number, e.g., `sc_1234`.

### Q3: Can multiple scenarios be compared simultaneously?

**Answer**: When some parameters are unset, the system automatically returns all matching scenarios, and the chart will display mean line and confidence intervals (future feature).

### Q4: What is the time range of the data?

**Answer**:
- Complete data: 1981-2885 (1905 time steps total)
- Display focus: 2020-2100 (future predictions)

### Q5: How is WSI (Water Stress Index) calculated?

**Answer**: WSI = Water consumption / Available water. Higher values indicate greater water stress:
- < 0.2: Low stress
- 0.2-0.4: Medium stress
- 0.4-0.6: High stress
- \> 0.6: Very high stress

### Q6: Can data or charts be exported?

**Answer**:
- **Charts**: Hover over chart, click camera icon in upper right to export PNG
- **Data**: Currently available via API interface (requires technical support)

### Q7: What's the difference between climate scenarios?

**Answer**:
- **Scenario 1 (RCP2.6-SSP1)**: Strict greenhouse gas emission control, sustainable development path
- **Scenario 2 (RCP4.5-SSP2)**: Medium emissions, moderate development path
- **Scenario 3 (RCP8.5-SSP5)**: High emissions, fossil fuel-dependent development

### Q8: Why do some variable names have [lijin]?

**Answer**: [lijin] refers to Lijin hydrological station, an important monitoring point at the Yellow River estuary. Its data represents the entire basin's outlet condition.

---

## 🔧 Technical Support

### Browser Requirements

- **Recommended**: Chrome 90+, Firefox 88+, Edge 90+
- **Minimum**: Modern browsers supporting ES2020
- **Not Supported**: Internet Explorer

### Performance Optimization

**If experiencing lag**:
1. Close other browser tabs
2. Clear browser cache
3. Reduce time range
4. Use Chrome browser

### Error Reporting

If encountering issues, please record:
1. Specific operation steps
2. Error message
3. Browser console information (press F12 to view)
4. Screenshots

Contact: songshgeo@gmail.com

---

## 📚 Related Resources

### Learning Materials

- **Research Paper**: Click 📄 button in lower left corner
- **Source Code**: Click 💻 button to visit GitHub repository
- **API Documentation**: http://127.0.0.1:8000/docs

### Citation

If you use this system in your research, please cite:
```
[Citation information to be added]
```

---

## 🎓 Tutorial Examples

### Example 1: Exploring Optimal Ecological Flow

**Objective**: Find ecological flow proportion that protects ecology without excessively affecting water supply

**Steps**:
1. Visit **Page 4 (Ecological Water)**
2. Set ecological flow to **0.2**, observe water availability
3. Adjust to **0.25**, compare changes
4. Adjust to **0.3**, view impact
5. Visit **Page 6 (Water Stress)** to check impact on water stress
6. Choose appropriate ecological flow proportion based on WSI value

**Expected Result**: 0.25 is typically a balance point

### Example 2: Evaluating Water-Saving Irrigation Effectiveness

**Objective**: Quantify impact of water-saving irrigation technology on agricultural water use

**Steps**:
1. Visit **Page 5 (Agriculture)**
2. Set water-saving efficiency to **0.8** (baseline)
3. Record mean irrigation water demand
4. Adjust to **0.95**, compare difference
5. Calculate water savings = (0.8 demand - 0.95 demand) / 0.8 demand

**Expected Result**: Approximately 15-20% water-saving potential

### Example 3: Integrated Scenario Design

**Objective**: Design a sustainable water resource management plan

**Steps**:
1. **Page 2**: Select **Climate scenario 2** (medium emissions)
2. **Page 3**: Set **Fertility 1.7** + **Diet scenario 2**
3. **Page 4**: Set **Ecological flow 0.25**
4. **Page 5**: Set **Water-saving efficiency 0.9** + **Fire generation 0.2**
5. **Page 6**: Check WSI, ensure most years < 0.4
6. If WSI too high, return to adjust parameters

**Success Criteria**: WSI < 0.4 for most of 2020-2100 period

---

## 📞 Contact Us

**Project Maintainer**: SongshGeo
**Email**: songshgeo@gmail.com
**GitHub**: [Project Repository Link]

**Feedback Channels**:
- Report Bugs: Submit GitHub Issue
- Feature Suggestions: Send email
- Usage Questions: Check FAQ or contact maintainer

---

## 📝 Changelog

### v1.0.0 (Current Version)
- ✅ 7 thematic pages
- ✅ 4725 scenario combinations
- ✅ Page 4 complete interactive functionality
- ✅ Dark mode support
- ✅ Real-time data updates

### Future Plans
- 🔄 Multi-scenario comparison feature
- 📊 More chart types
- 💾 Data export functionality
- 🌐 Multi-language support

---

**Enjoy using the platform!** 🎉

If you have any questions, please feel free to contact us.
