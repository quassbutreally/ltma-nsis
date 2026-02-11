// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const DEPARTURE_REFRESH_INTERVAL = 2000; // 2 seconds
const WEATHER_REFRESH_INTERVAL = 300000; // 5 minutes
const DEPARTED_DISPLAY_TIME = 180000; // 3 minutes in milliseconds
const ROW_HEIGHT = 28; // px per row
const HEADER_HEIGHT = 25; // px per section header

let departureRefreshTimer = null;
let weatherRefreshTimer = null;
let currentSectorGroup = null;
let currentPosition = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeClock();
    initializeSidebar();
    startAutoRefresh();
    checkServerConnection();
});

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

function initializeSidebar() {
    const sectorButtonsContainer = document.querySelector('.sector-buttons');
    
    SECTOR_GROUPS.forEach(sector => {
        const btn = document.createElement('button');
        btn.className = 'sector-btn';
        btn.textContent = sector.name;
        btn.dataset.sectorId = sector.id;
        btn.addEventListener('click', () => handleSectorClick(sector.id));
        sectorButtonsContainer.appendChild(btn);
    });
    
    const positionButtons = document.querySelectorAll('.position-btn');
    positionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.disabled) {
                handlePositionClick(btn.dataset.positionId);
            }
        });
    });
}

// Handle sector group button click
function handleSectorClick(sectorId) {
    currentSectorGroup = sectorId;
    currentPosition = null;
    
    document.querySelectorAll('.sector-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sectorId === sectorId);
    });
    
    updatePositionButtons(sectorId);
    clearMainContent();
}

// Update the top 8 position buttons based on selected sector
function updatePositionButtons(sectorId) {
    const positionButtons = document.querySelectorAll('.position-btn');
    const sectorConfig = POSITION_CONFIGS[sectorId];
    
    positionButtons.forEach((btn, index) => {
        if (sectorConfig && sectorConfig.positions[index]) {
            const position = sectorConfig.positions[index];
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

function handlePositionClick(positionId) {
    currentPosition = positionId;
    
    document.querySelectorAll('.position-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.positionId === positionId);
    });
    
    renderPositionContent();
}

function renderPositionContent() {
    if (!currentSectorGroup || !currentPosition) return;
    
    const sectorConfig = POSITION_CONFIGS[currentSectorGroup];
    const positionConfig = sectorConfig.positions.find(p => p.id === currentPosition);
    
    if (!positionConfig) return;
    
    // Validate percentages add up to 100
    validatePercentages(positionConfig.sections);
    
    renderWeatherSections(positionConfig.weather_sections || []);
    renderDepartureSections(positionConfig.sections);
    fetchDepartures();
}

// Validate that section percentages add up to 100
function validatePercentages(sections) {
    const total = sections.reduce((sum, s) => sum + s.height_percent, 0);
    
    if (total !== 100) {
        console.warn(`⚠ Section heights add up to ${total}%, not 100%. Check your config for position: ${currentPosition}`);
    }
}

// Calculate available height for departure lists
function getAvailableHeight() {
    const departureListsContainer = document.getElementById('departure-lists');
    return departureListsContainer.clientHeight;
}

async function renderWeatherSections(weatherConfigs) {
    const container = document.getElementById('weather-sections');
    container.innerHTML = '';
    
    for (const config of weatherConfigs) {
        const weatherBox = document.createElement('div');
        weatherBox.className = 'weather-box';
        weatherBox.dataset.airport = config.airport;
        weatherBox.dataset.label = config.label;
        
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
                        <span class="weather-qnh-value">N/A</span>
                    </div>
                </div>
            </div>
            <div class="weather-wind-wheel"></div>
        `;
        
        container.appendChild(weatherBox);
        await updateWeatherBox(weatherBox, config.airport);
    }
    
    startWeatherRefresh(weatherConfigs);
}

// Render departure list sections
function renderDepartureSections(sectionConfigs) {
    const container = document.getElementById('departure-lists');
    container.innerHTML = '';
    
    // Get available height after render
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
        const availableHeight = getAvailableHeight();
        
        sectionConfigs.forEach(sectionConfig => {
            const section = createSection(sectionConfig, availableHeight);
            container.appendChild(section);
        });
    });
}

// Create a section with height calculated from percentage
function createSection(sectionConfig, availableHeight) {
    const section = document.createElement('div');
    section.className = 'airport-section';
    section.dataset.airport = sectionConfig.airport;
    section.dataset.sids = JSON.stringify(sectionConfig.sids);
    section.dataset.routeIndicators = JSON.stringify(sectionConfig.route_indicators || []);  // ADD THIS
    
    // Calculate pixel height from percentage
    const sectionHeight = Math.floor((sectionConfig.height_percent / 100) * availableHeight);
    
    // Calculate max rows from available space (section height minus header)
    const listHeight = sectionHeight - HEADER_HEIGHT;
    const maxRows = Math.floor(listHeight / ROW_HEIGHT);
    section.dataset.maxRows = maxRows;
    
    const header = document.createElement('div');
    header.className = 'airport-header';
    header.innerHTML = `
        <span>${sectionConfig.label}</span>
        <span class="more-indicator">MORE 0</span>
    `;
    
    const list = document.createElement('div');
    list.className = 'departure-list';
    list.style.height = `${listHeight}px`;
    list.style.overflow = 'hidden';
    
    section.appendChild(header);
    section.appendChild(list);
    
    return section;
}

function clearMainContent() {
    if (weatherRefreshTimer) {
        clearInterval(weatherRefreshTimer);
        weatherRefreshTimer = null;
    }
    document.getElementById('weather-sections').innerHTML = '';
    document.getElementById('departure-lists').innerHTML = '';
}

async function checkServerConnection() {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
        const data = await response.json();
        updateConnectionStatus(data.status === 'ok');
    } catch (error) {
        updateConnectionStatus(false);
    }
}

function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = connected ? 'Connected' : 'Disconnected';
    statusElement.classList.toggle('connected', connected);
}

// Fetch departure data from backend
async function fetchDepartures() {
    if (!currentPosition) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/departures`);
        
        if (!response.ok) throw new Error('Failed to fetch departures');
        
        const data = await response.json();
        updateConnectionStatus(true);
        updateDepartures(data);
    } catch (error) {
        console.error('Error fetching departures:', error);
        updateConnectionStatus(false);
    }
}

// Update departure lists with new data
function updateDepartures(data) {
    const sections = document.querySelectorAll('.airport-section');
    
    sections.forEach(section => {
        const airport = section.dataset.airport;
        const sids = JSON.parse(section.dataset.sids);
        const maxRows = parseInt(section.dataset.maxRows);
        
        const airportAircraft = data[airport] || [];
        
        let filteredAircraft = airportAircraft.filter(ac => {
            if (!ac.sid) return false;
            return sids.some(sid => ac.sid.startsWith(sid));
        });
        
        filteredAircraft = filterDepartedAircraft(filteredAircraft);
        filteredAircraft.sort((a, b) => {
            const statusOrder = { 'AIRBORNE': 0, 'DEPA': 1, 'TAXI': 2 };
            const statusDiff = statusOrder[a.status] - statusOrder[b.status];
            if (statusDiff !== 0) return statusDiff;
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        updateSection(section, filteredAircraft, maxRows);
    });
}

async function updateWeatherBox(box, airport) {
    try {
        const response = await fetch(`${API_BASE_URL}/weather/${airport}`);
        
        if (!response.ok) throw new Error('Failed to fetch weather');
        
        const data = await response.json();

        // Clear and rebuild structure
        box.innerHTML = `
            <div class="weather-title">${box.dataset.label}</div>
            <div class="weather-content">
                <div class="weather-fields"></div>
                <div class="weather-qnh-row">
                    <div class="weather-qnh">
                        <span class="weather-qnh-label">QNH:</span>
                        <span class="weather-qnh-value"></span>
                    </div>
                    <div class="weather-qnh">
                        <span class="weather-qnh-label">QFE:</span>
                        <span class="weather-qnh-value">N/A</span>
                    </div>
                </div>
            </div>
            <div class="weather-wind-wheel"></div>
        `;

        renderWeatherFields(box, data);
        renderWindWheel(box, data.wind);
        
    } catch (error) {
        console.error(`Error fetching weather for ${airport}:`, error);
        box.querySelector('.weather-fields').innerHTML = 
            '<div class="weather-placeholder">Weather unavailable</div>';
    }
}

function renderWeatherFields(box, data) {
    const fieldsContainer = box.querySelector('.weather-fields');
    const qnhValue = box.querySelector('.weather-qnh-value');
    fieldsContainer.innerHTML = '';

    // TOI
    if (data.toi) {
        fieldsContainer.appendChild(createWeatherField('TOI', `${data.toi}`));
    }
    
    // Visibility
    fieldsContainer.appendChild(createWeatherField('VISIBILITY', data.cavok ? '' : (data.visibility || '')));

    // Weather
    fieldsContainer.appendChild(createWeatherField('WX', data.cavok ? 'CAVOK' : (data.weather || '')));

    // Always render exactly 3 cloud rows
    const sortedClouds = data.cavok ? [] : [...(data.clouds || [])].sort((a, b) => b.height - a.height);

    for (let i = 0; i < 3; i++) {
        const label = i === 0 ? 'CLOUD' : '';
        const value = sortedClouds[i] ? `${sortedClouds[i].cover} ${sortedClouds[i].height}` : '';
        fieldsContainer.appendChild(createWeatherField(label, value));
    }
    
    // Spacer to push temp/dp to bottom
    const spacer = document.createElement('div');
    spacer.className = 'weather-fields-spacer';
    fieldsContainer.appendChild(spacer);
    
    // Temp/Dewpoint
    if (data.temp !== null && data.dewpoint !== null) {
        const temp = String(Math.round(data.temp)).padStart(2, '0');
        const dewpoint = String(Math.round(data.dewpoint)).padStart(2, '0');
        fieldsContainer.appendChild(createWeatherField('TEMP/DP', `${temp}/${dewpoint}`));
    }
    
    // QNH
 if (data.qnh) {
        qnhValue.textContent = data.qnh.replace('hPa', 'A');
    }
}

function renderWindWheel(box, wind) {
    const container = box.querySelector('.weather-wind-wheel');
    container.innerHTML = '';

    // Get container dimensions
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

    // Helper: convert degrees to radians
    function toRadSegment(deg) {
        return (deg - 90 - 5) * Math.PI / 180;
    }

    // For everything else (arrow, cardinals, markers)
    function toRad(deg) {
        return (deg - 90) * Math.PI / 180;
    }
    // Helper: polar to cartesian
    function polarToCartesian(angle, radius) {
        return {
            x: cx + radius * Math.cos(toRad(angle)),
            y: cy + radius * Math.sin(toRad(angle))
        };
    }

    // Helper: draw a segment arc
    function drawSegment(startDeg, endDeg, colour) {

        function segPolar(angle, radius) {
            return {
                x: cx + radius * Math.cos(toRadSegment(angle)),
                y: cy + radius * Math.sin(toRadSegment(angle))
            };
        }

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

    // Determine which segments are active
    function isSegmentActive(segmentIndex) {
        if (!wind.direction && wind.direction !== 0) return false;

        const segmentDeg = segmentIndex * 10;

        if (wind.variable_from !== null && wind.variable_to !== null) {
            // Variable wind - highlight range
            let from = Math.round(wind.variable_from / 10) * 10;
            let to = Math.round(wind.variable_to / 10) * 10;

            if (from <= to) {
                return segmentDeg >= from && segmentDeg <= to;
            } else {
                // Wraps around 360
                return segmentDeg >= from || segmentDeg <= to;
            }
        } else {
            // Steady wind - highlight single segment
            const activeSegment = Math.round(wind.direction / 10) % 36;
            return segmentIndex === activeSegment;
        }
    }

    // Draw 36 segments
    for (let i = 0; i < 36; i++) {
        const startDeg = i * 10;
        const endDeg = startDeg + 10;
        const active = isSegmentActive(i);
        drawSegment(startDeg, endDeg, active ? '#ffffff' : '#00aa00');
    }

    // Draw degree markers outside the ring
    const markerRadius = outerRadius + size * 0.04;
    const markerTextRadius = outerRadius + size * 0.03;

    for (let i = 0; i < 36; i++) {
        if (i % 3 !== 0) continue; // Every 30 degrees

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
        // Format as 2-digit: 0 -> 36, 10 -> 03, 20 -> 06 etc.
        text.textContent = deg === 0 ? '36' : String(deg / 10).padStart(2, '0');
        svg.appendChild(text);
    }

    // Draw cardinal points inside the ring
    const cardinals = [
        { label: 'N', deg: 0 },
        { label: 'E', deg: 90 },
        { label: 'S', deg: 180 },
        { label: 'W', deg: 270 }
    ];

    const cardinalRadius = innerRadius * 0.55; // Closer to centre box

    cardinals.forEach(({ label, deg }) => {
        const pos = polarToCartesian(deg, cardinalRadius);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', pos.x);
        text.setAttribute('y', pos.y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', '#ffffff'); // White
        text.setAttribute('font-size', size * 0.09); // Larger
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

    // Draw wind direction arrow (only if there is wind)
    if (wind.direction !== null && wind.speed > 0) {
        const arrowLength = size * 0.08;
        const arrowWidth = size * 0.03;
        const arrowTipRadius = innerRadius - size * 0.01;
        const arrowBaseRadius = arrowTipRadius - arrowLength;

        const tip = polarToCartesian(wind.direction, arrowTipRadius);
        const baseCenter = polarToCartesian(wind.direction, arrowBaseRadius);

        // Perpendicular angle for arrow base width
        const perpAngle = wind.direction + 90;
        const baseLeft = polarToCartesian(perpAngle, arrowWidth);
        const baseRight = polarToCartesian(perpAngle + 180, arrowWidth);

        // Offset base points to be centered on baseCenter
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

    // Min/Max speed labels
    const minSpeed = wind.speed ? Math.round(wind.speed) : 0;
    const maxSpeed = wind.gust ? Math.round(wind.gust) : minSpeed;

    const minText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    minText.setAttribute('x', size * 0.08);
    minText.setAttribute('y', size * 0.08);
    minText.setAttribute('text-anchor', 'middle');
    minText.setAttribute('fill', '#00aa00');
    minText.setAttribute('font-size', size * 0.06);
    minText.setAttribute('font-family', 'sans-serif');
    minText.textContent = `Min`;
    svg.appendChild(minText);

    const minVal = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    minVal.setAttribute('x', size * 0.08);
    minVal.setAttribute('y', size * 0.15);
    minVal.setAttribute('text-anchor', 'middle');
    minVal.setAttribute('fill', '#ffffff');
    minVal.setAttribute('font-size', size * 0.07);
    minVal.setAttribute('font-family', 'sans-serif');
    minVal.setAttribute('font-weight', 'bold');
    minVal.textContent = minSpeed;
    svg.appendChild(minVal);

    const maxText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    maxText.setAttribute('x', size * 0.92);
    maxText.setAttribute('y', size * 0.08);
    maxText.setAttribute('text-anchor', 'middle');
    maxText.setAttribute('fill', '#00aa00');
    maxText.setAttribute('font-size', size * 0.06);
    maxText.setAttribute('font-family', 'sans-serif');
    maxText.textContent = `Max`;
    svg.appendChild(maxText);

    const maxVal = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    maxVal.setAttribute('x', size * 0.92);
    maxVal.setAttribute('y', size * 0.15);
    maxVal.setAttribute('text-anchor', 'middle');
    maxVal.setAttribute('fill', '#ffffff');
    maxVal.setAttribute('font-size', size * 0.07);
    maxVal.setAttribute('font-family', 'sans-serif');
    maxVal.setAttribute('font-weight', 'bold');
    maxVal.textContent = maxSpeed;
    svg.appendChild(maxVal);

    container.appendChild(svg);
}

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

function updateSection(section, aircraft, maxRows) {
    const list = section.querySelector('.departure-list');
    const moreIndicator = section.querySelector('.more-indicator');
    
    list.innerHTML = '';
    
    const visibleAircraft = aircraft.slice(0, maxRows);
    const overflowCount = Math.max(0, aircraft.length - maxRows);
    
    moreIndicator.textContent = `MORE ${overflowCount}`;
    
    visibleAircraft.forEach(ac => {
        const item = createDepartureItem(ac, JSON.parse(section.dataset.routeIndicators || '[]'));
        list.appendChild(item);
    });
}

function createDepartureItem(aircraft, routeIndicators) {
    const item = document.createElement('div');
    item.className = 'departure-item';

    const callsign = document.createElement('span');
    callsign.className = 'callsign';
    callsign.textContent = aircraft.callsign;

    const squawk = document.createElement('span');
    squawk.className = 'squawk';
    squawk.textContent = aircraft.squawk || '----';

    const sid = document.createElement('span');
    sid.className = 'sid';
    sid.textContent = aircraft.sid || '----';

    const matched = routeIndicators.find(ri => 
        aircraft.route && aircraft.route.includes(ri.keyword)
    );
    
    const route = document.createElement('span');
    route.className = 'route';
    route.textContent = matched ? matched.display : '';

    const indicator = document.createElement('span');
    indicator.className = 'indicator';

if (aircraft.status === 'TAXI') {
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

// Filter out departed aircraft older than 3 minutes
function filterDepartedAircraft(aircraft) {
    const now = Date.now();
    
    return aircraft.filter(ac => {
        if (ac.status === 'TAXI') return true;
        if (ac.status === 'DEPA') return true;
        
        if (ac.status === 'AIRBORNE') {
            const airborneTime = new Date(ac.timestamp).getTime();
            return (now - airborneTime) < DEPARTED_DISPLAY_TIME;
        }
        
        return false;
    });
}

function getCurrentMinute() {
    const now = new Date();
    return String(now.getUTCMinutes()).padStart(2, '0');
}

function startWeatherRefresh(weatherConfigs) {
    if (weatherRefreshTimer) clearInterval(weatherRefreshTimer);
    
    weatherRefreshTimer = setInterval(() => {
        const boxes = document.querySelectorAll('.weather-box');
        boxes.forEach(box => {
            const airport = box.dataset.airport;
            updateWeatherBox(box, airport);
        });
    }, WEATHER_REFRESH_INTERVAL);
}

function startAutoRefresh() {
    departureRefreshTimer = setInterval(() => {
        fetchDepartures();
        checkServerConnection();
    }, DEPARTURE_REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (departureRefreshTimer) {
        clearInterval(departureRefreshTimer);
        departureRefreshTimer = null;
    }
}

function debounce(func, wait) {
    let timeout;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(func, wait);
    }
}

// Recalculate section heights on window resize
window.addEventListener('resize', debounce(() => {
    if (currentPosition) {
        const sectorConfig = POSITION_CONFIGS[currentSectorGroup];
        const positionConfig = sectorConfig.positions.find(p => p.id === currentPosition);
        if (positionConfig) {
            renderDepartureSections(positionConfig.sections);
            fetchDepartures();
        }
    }
}, 250));