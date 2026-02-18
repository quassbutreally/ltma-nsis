/**
 * VATSIM Departure List - Frontend Application
 * 
 * Main application logic for displaying real-time departure lists
 * and weather information for VATSIM controllers.
 */

// ============================================================================
// Configuration
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
 * Initialize UTC clock display
 */
function initializeClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}:${seconds}`;
}

/**
 * Initialize sidebar buttons (sector groups and positions)
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
    
    validatePercentages(positionConfig.sections);
    renderWeatherSections(positionConfig.weather_sections || []);
    renderDepartureSections(positionConfig.sections);
    fetchDepartures();
}

/**
 * Validate that section percentages add up to 100
 */
function validatePercentages(sections) {
    const total = sections.reduce((sum, s) => sum + s.height_percent, 0);
    
    if (total !== 100) {
        console.warn(
            `⚠ Section heights add up to ${total}%, not 100%. ` +
            `Check config for position: ${currentPosition}`
        );
    }
}

/**
 * Clear all main content and stop timers
 */
function clearMainContent() {
    if (weatherRefreshTimer) {
        clearInterval(weatherRefreshTimer);
        weatherRefreshTimer = null;
    }
    
    document.getElementById('weather-sections').innerHTML = '';
    document.getElementById('departure-lists').innerHTML = '';
}

// ============================================================================
// Weather Panel
// ============================================================================

/**
 * Render weather sections for the current position
 */
async function renderWeatherSections(weatherConfigs) {
    const container = document.getElementById('weather-sections');
    container.innerHTML = '';
    
    for (const config of weatherConfigs) {
        const weatherBox = createWeatherBox(config);
        container.appendChild(weatherBox);
        await updateWeatherBox(weatherBox, config.airport, config);
    }
    
    startWeatherRefresh(weatherConfigs);
}

/**
 * Create empty weather box structure
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
 * Render weather text fields
 */
function renderWeatherFields(box, data) {
    const fieldsContainer = box.querySelector('.weather-fields');
    const qnhValue = box.querySelectorAll('.weather-qnh-value')[0];
    const qfeValue = box.querySelectorAll('.weather-qnh-value')[1];

    fieldsContainer.innerHTML = '';  // Clear placeholder FIRST

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
    
    // Temperature and dewpoint
    if (data.temp !== null && data.dewpoint !== null) {
        const temp = Math.round(data.temp) >= 0 ? String(Math.round(data.temp)).padStart(2, '0') : "M" + String(Math.abs(Math.round(data.temp))).padStart(2, '0');
        const dewpoint = Math.round(data.dewpoint) >= 0 ? String(Math.round(data.dewpoint)).padStart(2, '0') : "M" + String(Math.abs(Math.round(data.dewpoint))).padStart(2, '0');
        fieldsContainer.appendChild(
            createWeatherField('TEMP/DP', `${temp}/${dewpoint}`)
        );
    }
    
    // QNH
    if (data.qnh) {
        qnhValue.textContent = data.qnh.replace('hPa', 'A');
    } else {
        qfeValue.textContent = 'N/A';
    }
    // QFE
    if (data.qfe) {
        qfeValue.textContent = data.qfe.replace('hPa', 'A');
    } else {
        qfeValue.textContent = 'N/A';
    }
}

/**
 * Create a weather field row
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

/**
 * Start weather refresh timer
 */
function startWeatherRefresh(weatherConfigs) {
    if (weatherRefreshTimer) {
        clearInterval(weatherRefreshTimer);
    }
    
    weatherRefreshTimer = setInterval(() => {
        // Need to find the original config for each box
        const sectorConfig = POSITION_CONFIGS[currentSectorGroup];
        const positionConfig = sectorConfig?.positions.find(p => p.id === currentPosition);
        
        if (positionConfig) {
            document.querySelectorAll('.weather-box').forEach(box => {
                const airport = box.dataset.airport;
                const config = positionConfig.weather_sections.find(ws => ws.airport === airport);
                if (config) {
                    updateWeatherBox(box, airport, config);
                }
            });
        }
    }, WEATHER_REFRESH_INTERVAL);
}

// ============================================================================
// Wind Wheel (SVG)
// ============================================================================

/**
 * Render SVG wind wheel
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

    // Helper: determine if segment should be highlighted
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

    // Helper: draw a single segment
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
 * Render departure list sections
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
 * Create a departure list section
 */
function createSection(sectionConfig, availableHeight) {
    const section = document.createElement('div');
    section.className = 'airport-section';
    section.dataset.airport = sectionConfig.airport;
    section.dataset.sids = JSON.stringify(sectionConfig.sids);
    section.dataset.routeIndicators = JSON.stringify(sectionConfig.route_indicators || []);
    section.dataset.requiredRouteKeywords = JSON.stringify(sectionConfig.required_route_keywords || []);
    section.dataset.showStarted = 'true';
    
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
    
    // Add toggle click handler
    const toggleBtn = header.querySelector('.toggle-started');
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentState = section.dataset.showStarted === 'true';
        section.dataset.showStarted = (!currentState).toString();
        toggleBtn.textContent = currentState ? 'SHOW STARTED' : 'HIDE STARTED';
        
        // Refresh just this section
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
 */
function updateDepartures(data) {
    const sections = document.querySelectorAll('.airport-section');
    
    sections.forEach(section => {
        const airport = section.dataset.airport;
        const sids = JSON.parse(section.dataset.sids);
        const requiredRouteKeywords = JSON.parse(section.dataset.requiredRouteKeywords || '[]');
        const maxRows = parseInt(section.dataset.maxRows);
        const showStarted = section.dataset.showStarted === 'true';
        
        // Filter aircraft for this section
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
        
        // Remove old airborne aircraft
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
 * Update a single departure list section
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
 * Create a departure list item
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

    // SID
    const sid = document.createElement('span');
    sid.className = 'sid';
    // Strip suffix - just take letters before any digits
    const sidName = aircraft.sid ? aircraft.sid.replace(/\d.*$/, '') : '----';
    sid.textContent = sidName;

    // Route indicator (matched keyword)
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
        item.classList.add('started');
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
 * Check server health
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
 * Update connection status indicator
 */
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = connected ? 'Connected' : 'Disconnected';
    statusElement.classList.toggle('connected', connected);
}

/**
 * Start departure list auto-refresh
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
 * Debounce helper
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
 */
window.addEventListener('resize', debounce(() => {
    if (!currentPosition) return;
    
    const sectorConfig = POSITION_CONFIGS[currentSectorGroup];
    const positionConfig = sectorConfig?.positions.find(p => p.id === currentPosition);
    
    if (positionConfig) {
        renderDepartureSections(positionConfig.sections);
        fetchDepartures();
    }
}, 250));