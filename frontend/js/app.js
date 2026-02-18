/**
 * VATSIM Departure List - Frontend Application
 * 
 * Main application logic for displaying real-time departure lists
 * and weather information for VATSIM controllers.
 * 
 * @author VATSIM UK
 * @version 1.0.0
 */

// ============================================================================
// Configuration Constants
// ============================================================================

const API_BASE_URL = 'http://localhost:5000/api';
const DEPARTURE_REFRESH_INTERVAL = 2000; // 2 seconds
const WEATHER_REFRESH_INTERVAL = 180000; // 3 minutes
const DEPARTED_DISPLAY_TIME = 180000; // 3 minutes
const ROW_HEIGHT = 28; // pixels per departure row
const HEADER_HEIGHT = 25; // pixels per section header

// ============================================================================
// Application State
// ============================================================================

let departureRefreshTimer = null;
let weatherRefreshTimer = null;
let currentSectorGroup = null;
let currentPosition = null;

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeClock();
    initializeSidebar();
    startAutoRefresh();
    checkServerConnection();
});

/**
 * Initialize and start the UTC clock display
 * Updates every second to show current UTC time in HH:MM:SS format
 */
function initializeClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

/**
 * Update the clock display with current UTC time
 * @private
 */
function updateClock() {
    const now = new Date();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}:${seconds}`;
}

/**
 * Initialize sidebar buttons for sector groups and positions
 * Creates sector group buttons dynamically from SECTOR_GROUPS config
 * and attaches click handlers to position buttons
 */
function initializeSidebar() {
    // Create sector group buttons
    const sectorButtonsContainer = document.querySelector('.sector-buttons');
    SECTOR_GROUPS.forEach(sector => {
        const btn = document.createElement('button');
        btn.className = 'sector-btn';
        btn.textContent = sector.name;
        btn.dataset.sectorId = sector.id;
        btn.addEventListener('click', () => handleSectorClick(sector.id));
        sectorButtonsContainer.appendChild(btn);
    });
    
    // Attach listeners to position buttons
    const positionButtons = document.querySelectorAll('.position-btn');
    positionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.disabled) {
                handlePositionClick(btn.dataset.positionId);
            }
        });
    });
}

// ============================================================================
// Navigation Handlers
// ============================================================================

/**
 * Handle sector group button click
 * Updates button states, loads position buttons for the sector,
 * and automatically selects the default position if configured
 * 
 * @param {string} sectorId - The ID of the clicked sector group
 */
function handleSectorClick(sectorId) {
    currentSectorGroup = sectorId;
    
    // Update sector button states
    document.querySelectorAll('.sector-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sectorId === sectorId);
    });
    
    updatePositionButtons(sectorId);
    
    // Auto-load default position if configured
    const sectorConfig = POSITION_CONFIGS[sectorId];
    if (sectorConfig?.positions?.length > 0) {
        const defaultPositionId = sectorConfig.default_position || sectorConfig.positions[0].id;
        const defaultPosition = sectorConfig.positions.find(p => p.id === defaultPositionId);
        
        if (defaultPosition) {
            handlePositionClick(defaultPosition.id);
        } else {
            // Fallback to first if default not found
            handlePositionClick(sectorConfig.positions[0].id);
        }
    } else {
        currentPosition = null;
        clearMainContent();
    }
}

/**
 * Update the top 8 position buttons based on selected sector
 * Enables buttons for configured positions and disables unused slots
 * 
 * @param {string} sectorId - The ID of the sector group
 */
function updatePositionButtons(sectorId) {
    const positionButtons = document.querySelectorAll('.position-btn');
    const sectorConfig = POSITION_CONFIGS[sectorId];
    
    positionButtons.forEach((btn, index) => {
        const position = sectorConfig?.positions[index];
        
        if (position) {
            btn.textContent = position.name;
            btn.disabled = false;
            btn.dataset.positionId = position.id;
            btn.classList.remove('active');
        } else {
            btn.textContent = '';
            btn.disabled = true;
            btn.dataset.positionId = '';
            btn.classList.remove('active');
        }
    });
}

/**
 * Handle position button click
 * Handles position aliases and linked positions (for situational awareness displays)
 * Updates button highlighting and renders position content
 * 
 * @param {string} positionId - The ID of the clicked position
 */
function handlePositionClick(positionId) {
    const sectorConfig = POSITION_CONFIGS[currentSectorGroup];
    let positionConfig = sectorConfig.positions.find(p => p.id === positionId);
    
    if (!positionConfig) return;
    
    console.log('Clicked position:', positionId);
    console.log('Position config:', positionConfig);
    
    // If this is an alias, load the target position's config
    const targetPositionId = positionConfig.alias_for || positionId;
    const targetConfig = sectorConfig.positions.find(p => p.id === targetPositionId);
    
    if (!targetConfig) return;
    
    currentPosition = targetPositionId;
    
    console.log('Target position:', targetPositionId);
    console.log('Target config:', targetConfig);
    
    // Build list of all buttons that should be highlighted
    const linkedPositions = targetConfig.linked_positions || [];
    const activePositions = [targetPositionId, ...linkedPositions];
    
    console.log('Active positions should be:', activePositions);
    
    document.querySelectorAll('.position-btn').forEach(btn => {
        const shouldBeActive = activePositions.includes(btn.dataset.positionId);
        console.log(`Button ${btn.dataset.positionId}: ${shouldBeActive}`);
        btn.classList.toggle('active', shouldBeActive);
    });
    
    renderPositionContent();
}

/**
 * Render content for the selected position
 */
function renderPositionContent() {
    if (!currentSectorGroup || !currentPosition) return;
    
    const sectorConfig = POSITION_CONFIGS[currentSectorGroup];
    const positionConfig = sectorConfig.positions.find(p => p.id === currentPosition);
    
    if (!positionConfig) return;
    
    // Always clean up previous layout first
    const weatherContainer = document.getElementById('weather-sections');
    const departureContainer = document.getElementById('departure-lists');
    const contentArea = weatherContainer.parentElement;
    
    // Remove any layout classes
    contentArea.classList.remove('weather-only-mode');
    weatherContainer.classList.remove('weather-only-layout');
    departureContainer.style.display = '';
    
    // Check if this is a weather-only layout
    if (positionConfig.layout === 'weather_only') {
        renderWeatherOnlyLayout(positionConfig.weather_sections || []);
    } else {
        // Standard layout with departure lists
        validatePercentages(positionConfig.sections);
        renderWeatherSections(positionConfig.weather_sections || []);
        renderDepartureSections(positionConfig.sections);
        fetchDepartures();
    }
}

/**
 * Render weather-only layout (full width, side-by-side)
 * Used for positions like Northolt that only display weather
 * 
 * @param {Array} weatherConfigs - Array of weather section configurations
 */
async function renderWeatherOnlyLayout(weatherConfigs) {
    const weatherContainer = document.getElementById('weather-sections');
    const departureContainer = document.getElementById('departure-lists');
    const contentArea = weatherContainer.parentElement;
    
    // Clear both containers
    weatherContainer.innerHTML = '';
    departureContainer.innerHTML = '';
    
    // Hide departure container
    departureContainer.style.display = 'none';
    
    // Make content-area and weather-sections full width
    contentArea.classList.add('weather-only-mode');
    weatherContainer.classList.add('weather-only-layout');
    
    // Create all boxes first (instant - shows placeholders)
    const boxes = weatherConfigs.map(config => {
        const weatherBox = createWeatherBox(config);
        weatherContainer.appendChild(weatherBox);
        return { box: weatherBox, config };
    });
    
    // Fetch all weather data in parallel
    await Promise.all(boxes.map(({ box, config }) => 
        updateWeatherBox(box, config.airport, config)
    ));
    
    startWeatherRefresh(weatherConfigs);
}

/**
 * Validate that section percentages add up to 100
 * Logs a warning if percentages don't sum to 100%
 * 
 * @param {Array} sections - Array of section configurations
 */
function validatePercentages(sections) {
    if (sections == null)
        return;

    const total = sections.reduce((sum, s) => sum + s.height_percent, 0);
    
    if (total !== 100) {
        console.warn(
            `⚠ Section heights add up to ${total}%, not 100%. ` +
            `Check config for position: ${currentPosition}`
        );
    }
}

/**
 * Clear all main content and stop refresh timers
 * Called when switching positions or sectors
 */
function clearMainContent() {
    if (weatherRefreshTimer) {
        clearInterval(weatherRefreshTimer);
        weatherRefreshTimer = null;
    }
    
    const weatherContainer = document.getElementById('weather-sections');
    const departureContainer = document.getElementById('departure-lists');
    const contentArea = weatherContainer.parentElement;
    
    weatherContainer.innerHTML = '';
    weatherContainer.classList.remove('weather-only-layout');
    
    departureContainer.innerHTML = '';
    departureContainer.style.display = '';
    
    contentArea.classList.remove('weather-only-mode');
}

// ============================================================================
// Weather Panel - Standard View
// ============================================================================

/**
 * Render weather sections for the current position
 * Handles both standard weather boxes and composite views
 * Fetches all weather data in parallel for better performance
 * 
 * @param {Array} weatherConfigs - Array of weather section configurations
 */
async function renderWeatherSections(weatherConfigs) {
    const container = document.getElementById('weather-sections');
    container.innerHTML = '';
    
    // Separate standard and composite configs
    const standardConfigs = weatherConfigs.filter(c => c.type !== 'composite');
    const compositeConfigs = weatherConfigs.filter(c => c.type === 'composite');
    
    // Create all standard boxes first (instant - shows placeholders)
    const boxes = standardConfigs.map(config => {
        const weatherBox = createWeatherBox(config);
        container.appendChild(weatherBox);
        return { box: weatherBox, config };
    });
    
    // Fetch all standard weather data in parallel
    await Promise.all(boxes.map(({ box, config }) => 
        updateWeatherBox(box, config.airport, config)
    ));
    
    // Handle composite boxes
    for (const config of compositeConfigs) {
        const compositeBox = await createCompositeWeatherBox(config);
        container.appendChild(compositeBox);
    }
    
    startWeatherRefresh(weatherConfigs);
}

/**
 * Create empty weather box structure for a single airport
 * Applies airport-specific background color from AIRPORT_COLORS config
 * 
 * @param {Object} config - Weather section configuration
 * @param {string} config.airport - ICAO airport code
 * @param {string} config.label - Display label for the airport
 * @returns {HTMLElement} The created weather box element
 */
function createWeatherBox(config) {
    const weatherBox = document.createElement('div');
    weatherBox.className = 'weather-box';
    weatherBox.dataset.airport = config.airport;
    weatherBox.dataset.label = config.label;

    // Apply background colour (defaults to blue if unspecified)
    const backgroundColor = AIRPORT_COLORS[config.airport] || DEFAULT_AIRPORT_COLOR;
    weatherBox.style.backgroundColor = backgroundColor;
    
    weatherBox.innerHTML = `
        <div class="weather-title">${config.label}</div>
        <div class="weather-content">
            <div class="weather-fields">
                <div class="weather-placeholder">Fetching weather...</div>
            </div>
            <div class="weather-qnh-row">
                <div class="weather-qnh">
                    <span class="weather-qnh-label">QNH:</span>
                    <span class="weather-qnh-value"></span>
                </div>
                <div class="weather-qnh">
                    <span class="weather-qnh-label">QFE:</span>
                    <span class="weather-qnh-value"></span>
                </div>
            </div>
        </div>
        <div class="weather-wind-wheel"></div>
    `;
    
    return weatherBox;
}

/**
 * Fetch and display weather data for an airport
 * Fetches METAR from backend, rebuilds box structure, and renders fields and wind wheel
 * 
 * @param {HTMLElement} box - The weather box element to update
 * @param {string} airport - ICAO airport code
 * @param {Object} config - Weather section configuration
 */
async function updateWeatherBox(box, airport, config) {
    try {
        const response = await fetch(`${API_BASE_URL}/weather/${airport}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Rebuild box structure
        const newBox = createWeatherBox(config);
        box.replaceWith(newBox);
        
        renderWeatherFields(newBox, data);
        renderWindWheel(newBox, data.wind);
        
    } catch (error) {
        console.error(`Error fetching weather for ${airport}:`, error);
        const fields = box.querySelector('.weather-fields');
        if (fields) {
            fields.innerHTML = '<div class="weather-placeholder">Weather unavailable</div>';
        }
    }
}

/**
 * Render weather text fields in a weather box
 * Displays TOI, visibility, weather, clouds (3 layers), temp/dewpoint, QNH, and QFE
 * Handles CAVOK conditions and negative temperatures with 'M' prefix
 * 
 * @param {HTMLElement} box - The weather box element
 * @param {Object} data - Parsed METAR data from backend
 */
function renderWeatherFields(box, data) {
    const fieldsContainer = box.querySelector('.weather-fields');
    const qnhValue = box.querySelectorAll('.weather-qnh-value')[0];
    const qfeValue = box.querySelectorAll('.weather-qnh-value')[1];

    fieldsContainer.innerHTML = '';  // Clear placeholder

    // Time of issue
    if (data.toi) {
        fieldsContainer.appendChild(createWeatherField('TOI', `${data.toi}`));
    }
    
    // Visibility (blank if CAVOK)
    fieldsContainer.appendChild(
        createWeatherField('VISIBILITY', data.cavok ? '' : (data.visibility || ''))
    );

    // Weather (CAVOK or actual weather)
    fieldsContainer.appendChild(
        createWeatherField('WX', data.cavok ? 'CAVOK' : (data.weather || ''))
    );

    // Cloud layers (always 3 rows, highest to lowest)
    const sortedClouds = data.cavok ? [] : 
        [...(data.clouds || [])].sort((a, b) => b.height - a.height);

    for (let i = 0; i < 3; i++) {
        const label = i === 0 ? 'CLOUD' : '';
        const value = sortedClouds[i] ? 
            `${sortedClouds[i].cover} ${sortedClouds[i].height}` : '';
        fieldsContainer.appendChild(createWeatherField(label, value));
    }
    
    // Spacer to push temp/dp to bottom
    const spacer = document.createElement('div');
    spacer.className = 'weather-fields-spacer';
    fieldsContainer.appendChild(spacer);
    
    // Temperature and dewpoint (handle negative temps with M prefix)
    if (data.temp !== null && data.dewpoint !== null) {
        const temp = Math.round(data.temp) >= 0 ? 
            String(Math.round(data.temp)).padStart(2, '0') : 
            "M" + String(Math.abs(Math.round(data.temp))).padStart(2, '0');
        const dewpoint = Math.round(data.dewpoint) >= 0 ? 
            String(Math.round(data.dewpoint)).padStart(2, '0') : 
            "M" + String(Math.abs(Math.round(data.dewpoint))).padStart(2, '0');
        fieldsContainer.appendChild(
            createWeatherField('TEMP/DP', `${temp}/${dewpoint}`)
        );
    }
    
    // QNH
    if (data.qnh) {
        qnhValue.textContent = data.qnh.replace('hPa', 'A');
    } else {
        qnhValue.textContent = 'N/A';
    }
    
    // QFE
    if (data.qfe) {
        qfeValue.textContent = data.qfe.replace('hPa', 'A');
    } else {
        qfeValue.textContent = 'N/A';
    }
}

/**
 * Create a single weather field row with label and value
 * 
 * @param {string} label - Field label (e.g., 'TOI', 'VISIBILITY')
 * @param {string} value - Field value
 * @returns {HTMLElement} The created weather field element
 */
function createWeatherField(label, value) {
    const row = document.createElement('div');
    row.className = 'weather-field';
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'weather-label';
    labelSpan.textContent = label ? `${label}:` : '';
    
    const valueSpan = document.createElement('span');
    valueSpan.className = 'weather-value';
    valueSpan.textContent = value;
    
    row.appendChild(labelSpan);
    row.appendChild(valueSpan);
    
    return row;
}

// ============================================================================
// Weather Panel - Composite View
// ============================================================================

/**
 * Create composite weather box showing multiple airports in a grid
 * Used for positions like TC Midlands that need to monitor several airports
 * Displays TOI, temp/dewpoint, QNH, and clouds for each airport in a 3x2 grid
 * 
 * @param {Object} config - Composite weather configuration
 * @param {string[]} config.airports - Array of ICAO airport codes to display
 * @returns {Promise<HTMLElement>} The created composite weather box
 */
async function createCompositeWeatherBox(config) {
    const box = document.createElement('div');
    box.className = 'weather-composite';
    box.dataset.type = 'composite';
    box.dataset.airports = JSON.stringify(config.airports);
    
    // Fetch weather for all airports in parallel
    const weatherData = await Promise.all(
        config.airports.map(async airport => {
            try {
                const response = await fetch(`${API_BASE_URL}/weather/${airport}`);
                if (!response.ok) throw new Error('Failed to fetch');
                return { airport, data: await response.json() };
            } catch (error) {
                console.error(`Failed to fetch weather for ${airport}:`, error);
                return { airport, data: null };
            }
        })
    );
    
    // Create 3x2 grid
    const grid = document.createElement('div');
    grid.className = 'composite-grid';
    
    weatherData.forEach(({ airport, data }) => {
        const cell = createCompositeCell(airport, data);
        grid.appendChild(cell);
    });
    
    box.appendChild(grid);
    return box;
}

/**
 * Create a single cell in the composite weather grid
 * Displays compact weather information in a table format
 * 
 * @param {string} airport - ICAO airport code
 * @param {Object|null} data - Parsed METAR data (null if unavailable)
 * @returns {HTMLElement} The created composite cell element
 */
function createCompositeCell(airport, data) {
    const cell = document.createElement('div');
    cell.className = 'composite-cell';
    
    if (!data) {
        cell.innerHTML = `
            <div class="composite-airport">${airport}</div>
            <div class="composite-nodata">NO DATA</div>
        `;
        return cell;
    }
    
    // Format temperature and dewpoint (handle negatives with M prefix)
    var temp = '--'
    if (data.temp != null) {
        temp = Math.round(data.temp) >= 0 ? 
            String(Math.round(data.temp)).padStart(2, '0') : 
            "M" + String(Math.abs(Math.round(data.temp))).padStart(2, '0');
    }

    var dewpoint = '--'
    if (data.dewpoint != null) {
        dewpoint = Math.round(data.dewpoint) >= 0 ? 
            String(Math.round(data.dewpoint)).padStart(2, '0') : 
            "M" + String(Math.abs(Math.round(data.dewpoint))).padStart(2, '0');
    }

    const qnh = data.qnh ? data.qnh.replace('hPa', 'A') : 'N/A';
    
    // Build table HTML
    let tableHTML = `
        <div class="composite-airport">${airport}</div>
        <table class="composite-table">
            <tr><td>TOI:</td><td>${data.toi || '--'}Z</td></tr>
            <tr><td>TEMP/DP:</td><td>${temp}/${dewpoint}</td></tr>
            <tr><td>QNH:</td><td>${qnh}</td></tr>
    `;
    
    // Add clouds - vertically stacked, highest first
    if (data.cavok) {
        tableHTML += '<tr><td>CLD:</td><td>CAVOK</td></tr>';
    } else if (data.clouds && data.clouds.length > 0) {
        const sortedClouds = [...data.clouds].sort((a, b) => b.height - a.height);
        sortedClouds.forEach((cloud, index) => {
            const label = index === 0 ? 'CLD:' : '';
            tableHTML += `<tr><td>${label}</td><td>${cloud.cover} ${cloud.height}</td></tr>`;
        });
    } else {
        tableHTML += '<tr><td>CLD:</td><td>SKC</td></tr>';
    }
    
    tableHTML += '</table>';
    cell.innerHTML = tableHTML;
    
    return cell;
}

// ============================================================================
// Weather Refresh
// ============================================================================

/**
 * Start weather refresh timer
 * Updates both standard weather boxes and composite views every 3 minutes
 * Handles position changes by finding configs from current position
 * 
 * @param {Array} weatherConfigs - Array of weather section configurations (not currently used in refresh)
 */
function startWeatherRefresh(weatherConfigs) {
    if (weatherRefreshTimer) {
        clearInterval(weatherRefreshTimer);
    }
    
    weatherRefreshTimer = setInterval(() => {
        const sectorConfig = POSITION_CONFIGS[currentSectorGroup];
        const positionConfig = sectorConfig?.positions.find(p => p.id === currentPosition);
        
        if (positionConfig) {
            // Update standard weather boxes
            document.querySelectorAll('.weather-box').forEach(box => {
                const airport = box.dataset.airport;
                const config = positionConfig.weather_sections?.find(ws => ws.airport === airport);
                if (config) {
                    updateWeatherBox(box, airport, config);
                }
            });
            
            // Update composite weather boxes
            document.querySelectorAll('.weather-composite').forEach(async box => {
                const airports = JSON.parse(box.dataset.airports);
                const weatherData = await Promise.all(
                    airports.map(async airport => {
                        try {
                            const response = await fetch(`${API_BASE_URL}/weather/${airport}`);
                            if (!response.ok) throw new Error('Failed to fetch');
                            return { airport, data: await response.json() };
                        } catch (error) {
                            return { airport, data: null };
                        }
                    })
                );
                
                // Rebuild grid
                const grid = box.querySelector('.composite-grid');
                grid.innerHTML = '';
                weatherData.forEach(({ airport, data }) => {
                    const cell = createCompositeCell(airport, data);
                    grid.appendChild(cell);
                });
            });
        }
    }, WEATHER_REFRESH_INTERVAL);
}

// ============================================================================
// Wind Wheel (SVG)
// ============================================================================

/**
 * Render SVG wind wheel showing wind direction and speed
 * 
 * Features:
 * - 36 segments (10° each) representing wind direction
 * - Active segment(s) highlighted white (single for steady, range for variable)
 * - Wind direction arrow pointing inward
 * - Centre box displaying steady wind speed
 * - Min/Max speed labels in corners
 * - Cardinal points (N/E/S/W) inside the ring
 * - Bearing markers (every 30°) outside the ring
 * 
 * @param {HTMLElement} box - The weather box element containing the wind wheel
 * @param {Object} wind - Wind data from METAR
 * @param {number|null} wind.direction - Wind direction in degrees
 * @param {number|null} wind.speed - Wind speed in knots
 * @param {number|null} wind.gust - Gust speed in knots
 * @param {number|null} wind.variable_from - Variable wind range start (degrees)
 * @param {number|null} wind.variable_to - Variable wind range end (degrees)
 */
function renderWindWheel(box, wind) {
    const container = box.querySelector('.weather-wind-wheel');
    container.innerHTML = '';

    const size = Math.min(container.clientWidth, container.clientHeight);
    if (size === 0) return;

    const cx = size / 2;
    const cy = size / 2;
    const outerRadius = size * 0.4;
    const innerRadius = size * 0.35;
    const segmentGap = 2;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

    // Coordinate conversion helpers
    // Segments rotated -5° so 010 segment is centred on 010° bearing
    const toRadSegment = (deg) => (deg - 90 - 5) * Math.PI / 180;
    const toRad = (deg) => (deg - 90) * Math.PI / 180;
    
    const polarToCartesian = (angle, radius) => ({
        x: cx + radius * Math.cos(toRad(angle)),
        y: cy + radius * Math.sin(toRad(angle))
    });

    // Draw 36 wind direction segments
    for (let i = 0; i < 36; i++) {
        const startDeg = i * 10;
        const endDeg = startDeg + 10;
        const active = isSegmentActive(i, wind);
        drawSegment(startDeg, endDeg, active ? '#ffffff' : '#00aa00');
    }

    /**
     * Determine if a segment should be highlighted based on wind direction
     * @param {number} segmentIndex - Segment index (0-35)
     * @param {Object} wind - Wind data
     * @returns {boolean} True if segment should be highlighted
     */
    function isSegmentActive(segmentIndex, wind) {
        if (wind.direction === null && wind.direction !== 0) return false;

        const segmentDeg = segmentIndex * 10;

        if (wind.variable_from !== null && wind.variable_to !== null) {
            // Variable wind - highlight range
            const from = Math.round(wind.variable_from / 10) * 10;
            const to = Math.round(wind.variable_to / 10) * 10;

            if (from <= to) {
                return segmentDeg >= from && segmentDeg <= to;
            } else {
                // Range wraps around 360
                return segmentDeg >= from || segmentDeg <= to;
            }
        } else {
            // Steady wind - highlight single segment
            const activeSegment = Math.round(wind.direction / 10) % 36;
            return segmentIndex === activeSegment;
        }
    }

    /**
     * Draw a single wind direction segment
     * @param {number} startDeg - Segment start angle in degrees
     * @param {number} endDeg - Segment end angle in degrees
     * @param {string} colour - Fill colour for the segment
     */
    function drawSegment(startDeg, endDeg, colour) {
        const segPolar = (angle, radius) => ({
            x: cx + radius * Math.cos(toRadSegment(angle)),
            y: cy + radius * Math.sin(toRadSegment(angle))
        });

        const startOuter = segPolar(startDeg + segmentGap / 2, outerRadius);
        const endOuter = segPolar(endDeg - segmentGap / 2, outerRadius);
        const startInner = segPolar(startDeg + segmentGap / 2, innerRadius);
        const endInner = segPolar(endDeg - segmentGap / 2, innerRadius);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = [
            `M ${startOuter.x} ${startOuter.y}`,
            `A ${outerRadius} ${outerRadius} 0 0 1 ${endOuter.x} ${endOuter.y}`,
            `L ${endInner.x} ${endInner.y}`,
            `A ${innerRadius} ${innerRadius} 0 0 0 ${startInner.x} ${startInner.y}`,
            'Z'
        ].join(' ');

        path.setAttribute('d', d);
        path.setAttribute('fill', colour);
        svg.appendChild(path);
    }

    // Draw bearing markers (every 30 degrees)
    const markerTextRadius = outerRadius + size * 0.03;
    for (let i = 0; i < 36; i++) {
        if (i % 3 !== 0) continue;

        const deg = i * 10;
        const pos = polarToCartesian(deg, markerTextRadius);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', pos.x);
        text.setAttribute('y', pos.y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-size', size * 0.03);
        text.setAttribute('font-family', 'sans-serif');
        text.textContent = deg === 0 ? '36' : String(deg / 10).padStart(2, '0');
        svg.appendChild(text);
    }

    // Draw cardinal points (N/E/S/W)
    const cardinals = [
        { label: 'N', deg: 0 },
        { label: 'E', deg: 90 },
        { label: 'S', deg: 180 },
        { label: 'W', deg: 270 }
    ];

    const cardinalRadius = innerRadius * 0.55;
    cardinals.forEach(({ label, deg }) => {
        const pos = polarToCartesian(deg, cardinalRadius);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', pos.x);
        text.setAttribute('y', pos.y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-size', size * 0.09);
        text.setAttribute('font-family', 'sans-serif');
        text.setAttribute('font-weight', 'bold');
        text.textContent = label;
        svg.appendChild(text);
    });

    // Draw centre rectangle with wind speed
    const rectWidth = size * 0.2;
    const rectHeight = size * 0.14;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', cx - rectWidth / 2);
    rect.setAttribute('y', cy - rectHeight / 2);
    rect.setAttribute('width', rectWidth);
    rect.setAttribute('height', rectHeight);
    rect.setAttribute('fill', '#000000');
    rect.setAttribute('stroke', '#ffffff');
    rect.setAttribute('stroke-width', '1.5');
    rect.setAttribute('rx', '5');
    rect.setAttribute('ry', '5');
    svg.appendChild(rect);

    const speedText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    speedText.setAttribute('x', cx);
    speedText.setAttribute('y', cy);
    speedText.setAttribute('text-anchor', 'middle');
    speedText.setAttribute('dominant-baseline', 'middle');
    speedText.setAttribute('fill', '#ffffff');
    speedText.setAttribute('font-size', size * 0.08);
    speedText.setAttribute('font-family', 'sans-serif');
    speedText.setAttribute('font-weight', 'bold');
    speedText.textContent = wind.speed ? Math.round(wind.speed) : '0';
    svg.appendChild(speedText);

    // Draw wind direction arrow (only if wind exists)
    if (wind.direction !== null && wind.speed > 0) {
        const arrowLength = size * 0.08;
        const arrowWidth = size * 0.03;
        const arrowTipRadius = innerRadius - size * 0.01;
        const arrowBaseRadius = arrowTipRadius - arrowLength;

        const tip = polarToCartesian(wind.direction, arrowTipRadius);
        const baseCenter = polarToCartesian(wind.direction, arrowBaseRadius);

        const perpAngle = wind.direction + 90;
        const baseLeft = polarToCartesian(perpAngle, arrowWidth);
        const baseRight = polarToCartesian(perpAngle + 180, arrowWidth);

        const bl = {
            x: baseCenter.x + (baseLeft.x - cx),
            y: baseCenter.y + (baseLeft.y - cy)
        };
        const br = {
            x: baseCenter.x + (baseRight.x - cx),
            y: baseCenter.y + (baseRight.y - cy)
        };

        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrow.setAttribute('points', `${tip.x},${tip.y} ${bl.x},${bl.y} ${br.x},${br.y}`);
        arrow.setAttribute('fill', '#ffffff');
        svg.appendChild(arrow);
    }

    // Draw min/max speed labels
    const minSpeed = wind.speed ? Math.round(wind.speed) : 0;
    const maxSpeed = wind.gust ? Math.round(wind.gust) : minSpeed;

    const labels = [
        { text: 'Min', value: minSpeed, x: 0.08 },
        { text: 'Max', value: maxSpeed, x: 0.92 }
    ];

    labels.forEach(({ text, value, x }) => {
        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('x', size * x);
        labelText.setAttribute('y', size * 0.08);
        labelText.setAttribute('text-anchor', 'middle');
        labelText.setAttribute('fill', '#00aa00');
        labelText.setAttribute('font-size', size * 0.06);
        labelText.setAttribute('font-family', 'sans-serif');
        labelText.textContent = text;
        svg.appendChild(labelText);

        const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valueText.setAttribute('x', size * x);
        valueText.setAttribute('y', size * 0.15);
        valueText.setAttribute('text-anchor', 'middle');
        valueText.setAttribute('fill', '#ffffff');
        valueText.setAttribute('font-size', size * 0.07);
        valueText.setAttribute('font-family', 'sans-serif');
        valueText.setAttribute('font-weight', 'bold');
        valueText.textContent = value;
        svg.appendChild(valueText);
    });

    container.appendChild(svg);
}

// ============================================================================
// Departure Lists
// ============================================================================

/**
 * Render departure list sections for the current position
 * Calculates available height and creates sections with percentage-based sizing
 * 
 * @param {Array} sectionConfigs - Array of departure section configurations
 */
function renderDepartureSections(sectionConfigs) {
    const container = document.getElementById('departure-lists');
    container.innerHTML = '';
    
    // Wait for DOM to update before calculating heights
    requestAnimationFrame(() => {
        const availableHeight = container.clientHeight;
        
        sectionConfigs.forEach(sectionConfig => {
            const section = createSection(sectionConfig, availableHeight);
            container.appendChild(section);
        });
    });
}

/**
 * Create a single departure list section
 * Builds header with toggle button and overflow indicator, and departure list container
 * Calculates max rows based on available height
 * 
 * @param {Object} sectionConfig - Section configuration
 * @param {string} sectionConfig.airport - ICAO airport code
 * @param {string} sectionConfig.label - Display label for the section
 * @param {number} sectionConfig.height_percent - Percentage of available height (must sum to 100 across all sections)
 * @param {string[]} sectionConfig.sids - Array of SID prefixes to filter on
 * @param {Array} sectionConfig.route_indicators - Array of route keyword mappings for display
 * @param {Array} sectionConfig.required_route_keywords - Array of keywords that must be in route (AND filter with SID)
 * @param {number} availableHeight - Available height in pixels for all sections
 * @returns {HTMLElement} The created section element
 */
function createSection(sectionConfig, availableHeight) {
    const section = document.createElement('div');
    section.className = 'airport-section';
    section.dataset.airport = sectionConfig.airport;
    section.dataset.sids = JSON.stringify(sectionConfig.sids);
    section.dataset.routeIndicators = JSON.stringify(sectionConfig.route_indicators || []);
    section.dataset.requiredRouteKeywords = JSON.stringify(sectionConfig.required_route_keywords || []);
    section.dataset.showStarted = 'true';  // Default to showing STUP/PUSH aircraft
    
    const sectionHeight = Math.floor((sectionConfig.height_percent / 100) * availableHeight);
    const listHeight = sectionHeight - HEADER_HEIGHT;
    const maxRows = Math.floor(listHeight / ROW_HEIGHT);
    section.dataset.maxRows = maxRows;
    
    const header = document.createElement('div');
    header.className = 'airport-header';
    header.innerHTML = `
        <span>${sectionConfig.label}</span>
        <div class="header-right">
            <button class="toggle-started">HIDE STARTED</button>
            <span class="more-indicator">MORE 0</span>
        </div>
    `;
    
    // Add toggle click handler for showing/hiding STUP/PUSH aircraft
    const toggleBtn = header.querySelector('.toggle-started');
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentState = section.dataset.showStarted === 'true';
        section.dataset.showStarted = (!currentState).toString();
        toggleBtn.textContent = currentState ? 'SHOW STARTED' : 'HIDE STARTED';
        
        // Refresh display
        fetchDepartures();
    });
    
    const list = document.createElement('div');
    list.className = 'departure-list';
    list.style.height = `${listHeight}px`;
    list.style.overflow = 'hidden';
    
    section.appendChild(header);
    section.appendChild(list);
    
    return section;
}

/**
 * Fetch departure data from backend
 * Updates connection status and triggers departure list updates
 */
async function fetchDepartures() {
    if (!currentPosition) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/departures`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        updateConnectionStatus(true);
        updateDepartures(data);
        
    } catch (error) {
        console.error('Error fetching departures:', error);
        updateConnectionStatus(false);
    }
}

/**
 * Update all departure list sections with new data
 * Filters aircraft by SID and optionally by required route keywords
 * Sorts aircraft by status (AIRBORNE > DEPA > TAXI > STUP/PUSH) then by timestamp
 * 
 * @param {Object} data - Departure data from backend, keyed by airport
 */
function updateDepartures(data) {
    const sections = document.querySelectorAll('.airport-section');
    
    sections.forEach(section => {
        const airport = section.dataset.airport;
        const sids = JSON.parse(section.dataset.sids);
        const requiredRouteKeywords = JSON.parse(section.dataset.requiredRouteKeywords || '[]');
        const maxRows = parseInt(section.dataset.maxRows);
        const showStarted = section.dataset.showStarted === 'true';
        
        // Filter aircraft for this section by SID and optional route keywords
        let aircraft = (data[airport] || []).filter(ac => {
            // Must have matching SID
            if (!ac.sid || !sids.some(sid => ac.sid.startsWith(sid))) {
                return false;
            }
            
            // If required route keywords specified, route must contain at least one
            if (requiredRouteKeywords.length > 0) {
                if (!ac.route) return false;
                const hasRequiredKeyword = requiredRouteKeywords.some(keyword => 
                    ac.route.includes(keyword)
                );
                if (!hasRequiredKeyword) return false;
            }
            
            return true;
        });
        
        // Filter out STUP/PUSH if this section's toggle is off
        if (!showStarted) {
            aircraft = aircraft.filter(ac => 
                ac.status !== 'STUP' && ac.status !== 'PUSH'
            );
        }
        
        // Remove old airborne aircraft (>3 minutes)
        aircraft = filterDepartedAircraft(aircraft);
        
        // Sort: AIRBORNE > DEPA > TAXI > STUP/PUSH, then oldest first
        aircraft.sort((a, b) => {
            const statusOrder = { 
                'AIRBORNE': 0, 
                'DEPA': 1, 
                'TAXI': 2,
                'STUP': 3,
                'PUSH': 3
            };
            const statusDiff = statusOrder[a.status] - statusOrder[b.status];
            if (statusDiff !== 0) return statusDiff;
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        updateSection(section, aircraft, maxRows);
    });
}

/**
 * Update a single departure list section with filtered/sorted aircraft
 * Displays aircraft up to maxRows and shows overflow count
 * 
 * @param {HTMLElement} section - The section element to update
 * @param {Array} aircraft - Filtered and sorted aircraft array
 * @param {number} maxRows - Maximum number of rows that fit in the section
 */
function updateSection(section, aircraft, maxRows) {
    const list = section.querySelector('.departure-list');
    const moreIndicator = section.querySelector('.more-indicator');
    
    list.innerHTML = '';
    
    const visibleAircraft = aircraft.slice(0, maxRows);
    const overflowCount = Math.max(0, aircraft.length - maxRows);
    
    moreIndicator.textContent = `MORE ${overflowCount}`;
    
    const routeIndicators = JSON.parse(section.dataset.routeIndicators || '[]');
    visibleAircraft.forEach(ac => {
        const item = createDepartureItem(ac, routeIndicators);
        list.appendChild(item);
    });
}

/**
 * Create a departure list item for a single aircraft
 * Displays callsign, squawk, SID (without suffix), route indicator, and status
 * 
 * Status indicators:
 * - STUP/PUSH: Grey background, no indicator
 * - TAXI: '/'
 * - DEPA: 'X' 
 * - AIRBORNE: 'X MM' (MM = minutes past the hour)
 * 
 * @param {Object} aircraft - Aircraft data
 * @param {string} aircraft.callsign - Aircraft callsign
 * @param {string} aircraft.squawk - Assigned squawk code
 * @param {string} aircraft.sid - Full SID name (e.g., 'BPK7G')
 * @param {string} aircraft.route - Filed route
 * @param {string} aircraft.status - Aircraft status (STUP/PUSH/TAXI/DEPA/AIRBORNE)
 * @param {string} aircraft.timestamp - ISO timestamp of state change
 * @param {Array} routeIndicators - Array of route keyword mappings for this section
 * @returns {HTMLElement} The created departure item element
 */
function createDepartureItem(aircraft, routeIndicators) {
    const item = document.createElement('div');
    item.className = 'departure-item';

    // Callsign
    const callsign = document.createElement('span');
    callsign.className = 'callsign';
    callsign.textContent = aircraft.callsign;

    // Squawk
    const squawk = document.createElement('span');
    squawk.className = 'squawk';
    squawk.textContent = aircraft.squawk || '----';

    // SID (strip suffix - just letters before digits)
    const sid = document.createElement('span');
    sid.className = 'sid';
    const sidName = aircraft.sid ? aircraft.sid.replace(/\d.*$/, '') : '----';
    sid.textContent = sidName;

    // Route indicator (first matching keyword)
    const matched = routeIndicators.find(ri => 
        aircraft.route && aircraft.route.includes(ri.keyword)
    );
    const route = document.createElement('span');
    route.className = 'route';
    route.textContent = matched ? matched.display : '';

    // Status indicator
    const indicator = document.createElement('span');
    indicator.className = 'indicator';

    if (aircraft.status === 'PUSH' || aircraft.status === 'STUP') {
        item.classList.add('started');  // Grey background
    } else if (aircraft.status === 'TAXI') {
        indicator.textContent = '/';
        indicator.classList.add('taxi');
    } else if (aircraft.status === 'DEPA') {
        indicator.textContent = 'X';
        indicator.classList.add('departed');
    } else if (aircraft.status === 'AIRBORNE') {
        const airborneMinute = new Date(aircraft.timestamp).getUTCMinutes();
        indicator.textContent = `X ${String(airborneMinute).padStart(2, '0')}`;
        indicator.classList.add('departed');
    }

    item.appendChild(callsign);
    item.appendChild(squawk);
    item.appendChild(sid);
    item.appendChild(route);
    item.appendChild(indicator);

    return item;
}

/**
 * Filter out airborne aircraft older than 3 minutes
 * Keeps all STUP, PUSH, TAXI, and DEPA aircraft regardless of age
 * 
 * @param {Array} aircraft - Array of aircraft to filter
 * @returns {Array} Filtered aircraft array
 */
function filterDepartedAircraft(aircraft) {
    const now = Date.now();
    
    return aircraft.filter(ac => {
        if (ac.status === 'STUP' || ac.status === 'PUSH') return true;
        if (ac.status === 'TAXI') return true;
        if (ac.status === 'DEPA') return true;
        
        if (ac.status === 'AIRBORNE') {
            const airborneTime = new Date(ac.timestamp).getTime();
            return (now - airborneTime) < DEPARTED_DISPLAY_TIME;
        }
        
        return false;
    });
}

// ============================================================================
// Server Connection & Auto-Refresh
// ============================================================================

/**
 * Check server health via /health endpoint
 * Updates connection status indicator
 */
async function checkServerConnection() {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
        const data = await response.json();
        updateConnectionStatus(data.status === 'ok');
    } catch (error) {
        updateConnectionStatus(false);
    }
}

/**
 * Update connection status indicator in header
 * 
 * @param {boolean} connected - True if server is reachable and healthy
 */
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = connected ? 'Connected' : 'Disconnected';
    statusElement.classList.toggle('connected', connected);
}

/**
 * Start departure list auto-refresh
 * Fetches departure data and checks server connection every 2 seconds
 */
function startAutoRefresh() {
    departureRefreshTimer = setInterval(() => {
        fetchDepartures();
        checkServerConnection();
    }, DEPARTURE_REFRESH_INTERVAL);
}

// ============================================================================
// Window Resize Handler
// ============================================================================

/**
 * Debounce helper to limit function calls during rapid events
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Recalculate section heights on window resize
 * Rebuilds departure sections with new available height
 */
window.addEventListener('resize', debounce(() => {
    if (!currentPosition) return;
    
    const sectorConfig = POSITION_CONFIGS[currentSectorGroup];
    const positionConfig = sectorConfig?.positions.find(p => p.id === currentPosition);
    
    if (positionConfig) {
        // Only render departure sections if not weather-only layout
        if (positionConfig.layout !== 'weather_only') {
            renderDepartureSections(positionConfig.sections);
            fetchDepartures();
        }
    }
}, 250));