# VATSIM Departure List

A real-time departure list display for VATSIM controllers, integrated with EuroScope. Displays taxiing and departing aircraft for nominated airfields and SIDs, organised by control position.

Inspired by real-world ATC departure list systems used in UK airspace.

---

## Overview

This project consists of two components:

**EuroScope Plugin (C++ DLL)** — Monitors aircraft ground state changes within EuroScope and detects airborne transitions. Sends state updates to the local web server via HTTP.

**Web Application (Python/Flask + HTML/JS)** — Receives updates from the plugin, maintains current state, and serves a browser-based departure list display that updates in real time. Also fetches and displays live METAR data for nominated airfields.

---

## Prerequisites

- [EuroScope](https://www.euroscope.hu/) (32-bit)
- Python 3.7 or later
- A modern web browser
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) (for building the plugin)
- [CLion](https://www.jetbrains.com/clion/) or another CMake-compatible C++ IDE (recommended)
- The EuroScope Plugin SDK (`EuroScopePlugInDll.lib` and `EuroScopePlugIn.h`)
- [cpp-httplib](https://github.com/yhirose/cpp-httplib) (`httplib.h` — single header file)

---

## Project Structure

```
vatsim-departure-list/
├── backend/
│   ├── app.py                  # Flask server
│   ├── requirements.txt        # Python dependencies
│   └── config/
│       └── positions.json      # (unused - config is frontend-side)
├── frontend/
│   ├── index.html              # Main page
│   ├── config/
│   │   └── positions.js        # Position and airfield configuration
│   ├── css/
│   │   └── style.css           # Styling
│   └── js/
│       └── app.js              # Frontend logic
└── plugin/
    ├── CMakeLists.txt
    ├── sdk/
    │   ├── EuroScopePlugIn.h       # EuroScope SDK header (provide your own)
    │   ├── EuroScopePlugInDll.lib  # EuroScope SDK lib (provide your own)
    │   └── httplib.h               # cpp-httplib (provide your own)
    └── src/
        └── plugin.cpp          # Plugin source
```

---

## Setup

### Backend

1. Navigate to the `backend/` directory:
   ```cmd
   cd backend
   ```

2. Create a Python virtual environment:
   ```cmd
   python -m venv venv
   ```

3. Activate it:
   ```cmd
   venv\Scripts\activate.bat
   ```

4. Install dependencies:
   ```cmd
   pip install -r requirements.txt
   ```

5. Start the server:
   ```cmd
   python app.py
   ```

The server will start on `http://0.0.0.0:5000`. Leave this terminal running.

---

### Frontend

Open `frontend/index.html` in your browser. If you are using VS Code, the Live Server extension is recommended.

---

### Plugin

1. Obtain the EuroScope Plugin SDK files and place them in `plugin/sdk/`
2. Download `httplib.h` from [cpp-httplib](https://github.com/yhirose/cpp-httplib) and place it in `plugin/sdk/`
3. Open the `plugin/` folder in CLion
4. In CLion, go to **File → Settings → Build, Execution, Deployment → Toolchains** and set your Visual Studio toolchain architecture to **x86** (EuroScope is a 32-bit application)
5. Build the project — this will produce `VatsimDepartureList.dll`
6. Copy the DLL to your EuroScope plugins folder
7. In EuroScope, go to **Other Set → Plug-ins → Load a plug-in** and load the DLL

---

## Configuration

All position configuration lives in `frontend/config/positions.js`.

### Sector Groups

The bottom 14 sidebar buttons are defined in `SECTOR_GROUPS`:

```javascript
const SECTOR_GROUPS = [
  { id: 'TC_EAST', name: 'TC EAST' },
  // ...
];
```

### Positions

Each sector group has up to 8 positions (top sidebar buttons). Each position defines its weather sections and departure list sections:

```javascript
const POSITION_CONFIGS = {
  "TC_EAST": {
    "positions": [
      {
        "id": "SABER",
        "name": "SABER",
        "weather_sections": [
          {
            "airport": "EGLL",
            "label": "HEATHROW"    // Display name shown at top of weather panel
          }
        ],
        "sections": [
          {
            "airport": "EGLL",
            "label": "EGLL BPK BPK/L",
            "height_percent": 50,       // % of available display height
            "sids": ["BPK"],            // SID prefixes to match
            "route_indicators": [       // Optional route keyword mappings
              { "keyword": "M85", "display": "ITVIP" },
              { "keyword": "M84", "display": "DVR" }
            ]
          }
        ]
      }
    ]
  }
};
```

**Important:** `height_percent` values for all sections within a position must add up to exactly 100. A console warning will appear if they do not.

---

## How It Works

### Aircraft States

The plugin monitors three states set by controllers in EuroScope:

| State | Display | Meaning |
|-------|---------|---------|
| `TAXI` | `/` | Aircraft is taxiing |
| `DEPA` | `X` | Aircraft is cleared for takeoff |
| `AIRBORNE` | `X 45` | Aircraft is airborne (time = minutes past the hour) |

Airborne state is detected automatically by the plugin when an aircraft in `DEPA` state exceeds **40 knots ground speed** and **200 fpm vertical rate**.

Airborne aircraft are automatically removed from the display **3 minutes** after becoming airborne.

### Sort Order

Within each section, aircraft are displayed in the following order:
1. AIRBORNE (oldest first)
2. DEPA (oldest first)
3. TAXI (oldest first)

### Overflow

If more aircraft are present than a section can display, the excess count is shown in the section header as `MORE N`.

### Route Indicators

Each departure list section can optionally define route indicators — keyword mappings that scan the filed route and display a short label in the route column. For example, if an aircraft's route contains `M85`, the route column will display `ITVIP`. This is useful for highlighting routing that is operationally significant to a particular sector.

Only the first matching keyword is displayed. If no keywords match, the route column is blank.

---

## Weather Panel

Each position can define one or more weather panels. Weather data is fetched from the [VATSIM METAR API](https://metar.vatsim.net) on demand and cached for 5 minutes. The panel displays:

- **TOI** — Time of issue (UTC)
- **VISIBILITY** — Visibility in km, or `CAVOK` if applicable
- **WX** — Present weather (e.g. light rain and drizzle)
- **CLOUD** — Up to 3 cloud layers, displayed highest to lowest (e.g. `BKN 2400`)
- **TEMP/DP** — Temperature and dewpoint (e.g. `11/09`)
- **QNH** — Altimeter setting in hPa (displayed as e.g. `983A`)

### Wind Wheel

The lower half of each weather panel contains an SVG wind wheel:

- 36 segments representing wind direction in 10° increments, each centred on its reported bearing
- The segment corresponding to the reported wind direction is highlighted white; all others are green
- For variable winds, all segments within the reported range are highlighted white
- A white arrow inside the ring points toward the active bearing
- The centre box displays the steady wind speed
- Min/Max labels in the corners show steady wind speed (min) and gust speed (max); if no gust is reported, both show the steady speed
- Cardinal points (N/E/S/W) are displayed inside the ring
- Bearing markers (36, 03, 06... etc.) are displayed outside the ring
- No arrow or highlighted segment is drawn when wind speed is zero

---

## API Endpoints

The Flask backend exposes the following endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/status-update` | Receive aircraft state update from plugin |
| `GET` | `/api/departures` | Get all current departure data |
| `GET` | `/api/departures/<airport>` | Get departures for a specific airport |
| `GET` | `/api/weather/<airport>` | Get parsed METAR data for a specific airport |
| `POST` | `/api/clear` | Clear all aircraft data |
| `GET` | `/health` | Health check |

### Status Update Payload

```json
{
  "callsign": "BAW123",
  "airport": "EGLL",
  "status": "TAXI",
  "sid": "BPK7G",
  "squawk": "1234",
  "route": "BPK L620 DVR UL9 KONAN"
}
```

### Weather Response

```json
{
  "airport": "EGLL",
  "toi": "1220",
  "cavok": false,
  "visibility": "8KM",
  "weather": "light rain and drizzle",
  "clouds": [
    { "cover": "BKN", "height": 2400 },
    { "cover": "SCT", "height": 2000 },
    { "cover": "FEW", "height": 1500 }
  ],
  "temp": 11.0,
  "dewpoint": 9.0,
  "qnh": "983hPa",
  "wind": {
    "direction": 250.0,
    "speed": 13.0,
    "gust": null,
    "variable_from": null,
    "variable_to": null
  },
  "raw": "EGLL 111220Z AUTO 25013KT 9999 -RADZ FEW012 BKN018 BKN027 11/09 Q0983 TEMPO SHRA"
}
```

---

## Testing Without EuroScope

You can inject test data directly using PowerShell:

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:5000/api/status-update `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"callsign":"BAW123","airport":"EGLL","status":"TAXI","sid":"BPK7G","squawk":"1234","route":"BPK M85 ITVIP"}'
```

You can also test the weather endpoint directly in a browser:
```
http://127.0.0.1:5000/api/weather/EGLL
```

---

## Known Limitations

- Aircraft state is held in memory only — restarting the Flask server clears all data
- Sector home pages are not yet implemented
- Weather panel background colour is not yet configurable per airport
- ATIS integration is not yet implemented — weather is sourced from METAR only

---

## Roadmap

- [x] METAR integration with wind wheel display
- [ ] ATIS integration (with METAR fallback)
- [ ] Configurable weather panel background colour per airport
- [ ] Sector home pages
- [ ] Persistent state across server restarts
- [ ] Additional sector group configurations

---

## License

TBD