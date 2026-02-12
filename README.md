# VATSIM Departure List

A real-time departure list display for VATSIM controllers, integrated with EuroScope. Displays taxiing and departing aircraft for nominated airfields and SIDs, organised by control position with live weather information.

Inspired by real-world ATC departure list systems used in UK airspace.

---

## Overview

This project consists of three components:

**EuroScope Plugin (C++ DLL)** — Monitors aircraft ground state changes within EuroScope (STUP, PUSH, TAXI, DEPA) and detects airborne transitions. Sends state updates to the local web server via HTTP.

**Backend Server (Python/Flask)** — Receives updates from the plugin, maintains current aircraft state, and serves departure list and weather data via REST API. Fetches live METAR data from VATSIM and caches it for efficient delivery.

**Frontend Web Interface (HTML/JS/CSS)** — Browser-based dashboard displaying real-time departure lists and weather panels. Updates every 2 seconds for departures, 3 minutes for weather. Fully responsive with percentage-based layouts.

---

## Features

### Departure Lists
- **Real-time updates** from EuroScope plugin
- **Four aircraft states**: STUP/PUSH (startup), TAXI, DEPA (cleared for takeoff), AIRBORNE
- **Automatic sorting**: AIRBORNE → DEPA → TAXI → STUP/PUSH, oldest first within each category
- **SID filtering**: Each section displays only aircraft on specified SID prefixes
- **Route indicators**: Configurable keyword mapping (e.g. M85 → ITVIP) for operationally significant routing
- **Overflow handling**: Displays `MORE N` when more aircraft exist than can fit on screen
- **Toggle startup aircraft**: Per-section button to show/hide STUP/PUSH aircraft (grey background when shown)
- **Auto-cleanup**: Airborne aircraft automatically removed after 3 minutes
- **Percentage-based layouts**: Section heights defined as percentages for consistent display across screen sizes

### Weather Panels
- **Live METAR data** from VATSIM API
- **Parsed weather fields**: TOI, Visibility, Weather, Cloud (up to 3 layers), Temp/Dewpoint, QNH
- **CAVOK detection** and display
- **SVG Wind Wheel**:
  - 36 segments (10° each) showing wind direction
  - Active segment(s) highlighted white for steady or variable wind
  - Wind direction arrow pointing to active bearing
  - Centre box showing steady wind speed
  - Min/Max labels (steady and gust speeds)
  - Cardinal points and bearing markers
- **Colour-coded airports**: Configurable background colours per airport (Heathrow green, Stansted yellow, Luton orange, Gatwick pink, default blue)
- **5-minute cache** for METAR data to reduce API calls

### Position Configuration
- **14 sector groups** with up to 8 positions each
- **Configurable defaults**: Each sector group can specify a default position to load on selection
- **Linked positions**: Positions can be linked (e.g. LOREL shows NE_DEPS content for situational awareness)
- **Flexible section layouts**: Each position defines multiple departure list sections with independent height percentages, SID filters, and route indicators

---

## Prerequisites

### For Development
- [EuroScope](https://www.euroscope.hu/) (32-bit)
- Python 3.7 or later
- A modern web browser
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) (for building the plugin)
- [CLion](https://www.jetbrains.com/clion/) or another CMake-compatible C++ IDE (recommended)
- The EuroScope Plugin SDK (`EuroScopePlugInDll.lib` and `EuroScopePlugIn.h`)
- [cpp-httplib](https://github.com/yhirose/cpp-httplib) (`httplib.h` — single header file)

### For End Users
- EuroScope (32-bit)
- Windows 10 or later

---

## Project Structure

```
vatsim-departure-list/
├── backend/
│   ├── app.py                      # Flask REST API server
│   ├── tray_app.py                 # System tray application wrapper
│   ├── requirements.txt            # Python dependencies
│   └── config/
│       └── positions.json          # (unused - config is frontend-side)
├── frontend/
│   ├── index.html                  # Main page
│   ├── config/
│   │   └── positions.js            # Position and airfield configuration
│   ├── css/
│   │   └── style.css               # Styling
│   └── js/
│       └── app.js                  # Frontend logic
└── plugin/
    ├── CMakeLists.txt
    ├── sdk/
    │   ├── EuroScopePlugIn.h       # EuroScope SDK header
    │   ├── EuroScopePlugInDll.lib  # EuroScope SDK library
    │   └── httplib.h               # cpp-httplib header-only HTTP library
    └── src/
        └── plugin.cpp              # Plugin source code
```

---

## Installation for End Users

1. **Download** the latest release package
2. **Extract** to a folder of your choice (e.g. `C:\Program Files\VatsimDepartureList\`)
3. **Copy** `VatsimDepartureList.dll` from the `plugin\` folder to your EuroScope plugins folder
4. **Run** `VatsimDepartureList.exe` - a system tray icon will appear and your browser will open automatically
5. **In EuroScope**: Go to **Other Set → Plug-ins → Load** and load `VatsimDepartureList.dll`

The application runs silently in the system tray. Right-click the icon to:
- Open Dashboard
- Restart Server  
- Exit

---

## Development Setup

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

## Building for Distribution

### Package Backend with PyInstaller

```bash
cd backend
venv\Scripts\activate.bat
pip install pyinstaller pystray pillow
pyinstaller --onefile --noconsole --name VatsimDepartureList --add-data "../frontend;frontend" tray_app.py
```

This creates a single executable in `backend/dist/VatsimDepartureList.exe` with the frontend bundled inside.

### Build Plugin

In CLion, build the Release configuration to produce `VatsimDepartureList.dll`.

### Create Distribution Package

```
VatsimDepartureList/
├── VatsimDepartureList.exe        (from backend/dist/)
└── plugin/
    └── VatsimDepartureList.dll    (from plugin build)
```

Zip this folder for distribution.

---

## Configuration

All position configuration lives in `frontend/config/positions.js`.

### Airport Colours

Define weather box background colours globally:

```javascript
const AIRPORT_COLORS = {
    'EGLL': '#00ff00',  // Heathrow - Green
    'EGSS': '#ffff00',  // Stansted - Yellow
    'EGGW': '#ff8c00',  // Luton - Orange
    'EGKK': '#ff69b4',  // Gatwick - Pink
};
const DEFAULT_AIRPORT_COLOR = '#4169e1';  // Blue
```

### Sector Groups

The bottom 14 sidebar buttons are defined in `SECTOR_GROUPS`:

```javascript
const SECTOR_GROUPS = [
  { id: 'TC_EAST', name: 'TC EAST' },
  { id: 'TC_NORTH', name: 'TC NORTH' },
  // ...
];
```

### Positions

Each sector group has up to 8 positions (top sidebar buttons). Each position defines its weather sections, departure list sections, and optionally a default position and linked positions:

```javascript
const POSITION_CONFIGS = {
  "TC_EAST": {
    "default_position": "SABER",  // Position to load when sector is clicked
    "positions": [
      {
        "id": "SABER",
        "name": "SABER",
        "linked_positions": ["LOREL"],  // These buttons also highlight when SABER is active
        "weather_sections": [
          {
            "airport": "EGLL",
            "label": "HEATHROW"
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
      },
      {
        "id": "LOREL",
        "name": "LOREL",
        "alias_for": "NE_DEPS"  // Shows NE_DEPS content (inbound position with departure list for situational awareness)
      }
    ]
  }
};
```

**Important:** `height_percent` values for all sections within a position must add up to exactly 100. A console warning will appear if they do not.

---

## How It Works

### Aircraft States

The plugin monitors four ground states set by controllers in EuroScope:

| State | Display | Meaning |
|-------|---------|---------|
| `STUP` / `PUSH` | Grey background, no indicator | Aircraft is starting up or pushing back (optional display) |
| `TAXI` | `/` (yellow) | Aircraft is taxiing |
| `DEPA` | `X` (green) | Aircraft is cleared for takeoff |
| `AIRBORNE` | `X 45` (green) | Aircraft is airborne (45 = minutes past the hour) |

**State Transitions:**
- Setting ground state to empty (NSTS) sends a `CLEAR` status and removes the aircraft from the list
- Airborne state is detected automatically when an aircraft in `DEPA` exceeds **40 knots ground speed** and **200 fpm vertical rate**
- Airborne aircraft are automatically removed from the display **3 minutes** after becoming airborne

### Sort Order

Within each section, aircraft are displayed in the following order:
1. AIRBORNE (oldest first)
2. DEPA (oldest first)
3. TAXI (oldest first)
4. STUP/PUSH (oldest first) — if shown

### Overflow

If more aircraft are present than a section can display, the excess count is shown in the section header as `MORE N`.

### Route Indicators

Each departure list section can optionally define route indicators — keyword mappings that scan the filed route and display a short label in the route column. For example, if an aircraft's route contains `M85`, the route column will display `ITVIP`. This is useful for highlighting routing that is operationally significant to a particular sector.

Only the first matching keyword is displayed. If no keywords match, the route column is blank.

### Startup Aircraft Toggle

Each departure list section has a `HIDE STARTED` / `SHOW STARTED` button. When shown, STUP and PUSH aircraft appear with a grey background. When hidden, they are filtered out. This allows controllers to focus on active departures while still having situational awareness of aircraft preparing to taxi.

---

## API Endpoints

The Flask backend exposes the following endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serve the main frontend page |
| `GET` | `/<path>` | Serve static frontend assets |
| `POST` | `/api/status-update` | Receive aircraft state update from plugin |
| `GET` | `/api/departures` | Get all current departure data |
| `GET` | `/api/departures/<airport>` | Get departures for a specific airport |
| `GET` | `/api/weather/<airport>` | Get parsed METAR data for a specific airport |
| `POST` | `/api/clear` | Clear all aircraft data (testing only) |
| `GET` | `/health` | Health check |

### Status Update Payload

```json
{
  "callsign": "BAW123",
  "airport": "EGLL",
  "status": "STUP" | "PUSH" | "TAXI" | "DEPA" | "AIRBORNE" | "CLEAR",
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
# Add aircraft in TAXI state
Invoke-WebRequest -Uri http://127.0.0.1:5000/api/status-update `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"callsign":"BAW123","airport":"EGLL","status":"TAXI","sid":"BPK7G","squawk":"1234","route":"BPK M85 ITVIP"}'

# Change to DEPA
Invoke-WebRequest -Uri http://127.0.0.1:5000/api/status-update `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"callsign":"BAW123","airport":"EGLL","status":"DEPA","sid":"BPK7G","squawk":"1234","route":"BPK M85 ITVIP"}'

# Remove aircraft
Invoke-WebRequest -Uri http://127.0.0.1:5000/api/status-update `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"callsign":"BAW123","airport":"EGLL","status":"CLEAR","sid":"","squawk":"","route":""}'
```

You can also test the weather endpoint directly in a browser:
```
http://127.0.0.1:5000/api/weather/EGLL
```

---

## Known Limitations

- Aircraft state is held in memory only — restarting the backend clears all data
- METAR fields with `///` (not reported) are not explicitly handled yet
- ATIS integration is not implemented — weather is sourced from METAR only
- System tray "Restart Server" option requires full application restart

---

## Roadmap

- [x] METAR integration with wind wheel display
- [x] STUP/PUSH aircraft states with toggle display
- [x] Configurable default positions per sector
- [x] Linked positions for situational awareness
- [x] Route indicators for operationally significant routing
- [x] CLEAR status to remove aircraft from lists
- [x] System tray application for easy user control
- [ ] ATIS integration (with METAR fallback)
- [ ] Handle `///` (not reported) fields in METAR display
- [ ] Persistent storage across server restarts
- [ ] Centrally-hosted position configuration updates
- [ ] Additional sector group configurations

---

## Troubleshooting

**Plugin not loading in EuroScope:**
- Ensure the DLL is 32-bit (x86) architecture
- Check EuroScope plugin log for error messages
- Verify EuroScope SDK version compatibility

**Backend won't start:**
- Check port 5000 is not already in use: `netstat -ano | findstr :5000`
- Check Windows Firewall isn't blocking the application
- Check system tray for the application icon

**Aircraft not appearing in lists:**
- Verify backend is running (check system tray icon)
- Check Flask console for incoming requests
- Verify SID prefixes in position config match actual aircraft SIDs
- Check browser console (F12) for errors

**Weather not updating:**
- METAR cache is 60 seconds - wait for next refresh
- Check Flask console for METAR fetch errors
- Verify VATSIM METAR API is accessible: `https://metar.vatsim.net/EGLL`

---

## License

TBD

---

## Credits

Developed for UK VATSIM controllers. Inspired by real-world departure list systems.

Built with:
- [Flask](https://flask.palletsprojects.com/)
- [cpp-httplib](https://github.com/yhirose/cpp-httplib)
- [python-metar](https://github.com/python-metar/python-metar)
- [pystray](https://github.com/moses-palmer/pystray)
- [EuroScope Plugin SDK](https://www.euroscope.hu/wp/downloads/)