// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const REFRESH_INTERVAL = 2000; // 2 seconds
const DEPARTED_DISPLAY_TIME = 180000; // 3 minutes in milliseconds
const ROW_HEIGHT = 28; // px per row
const HEADER_HEIGHT = 25; // px per section header

let refreshTimer = null;
let currentSectorGroup = null;
let currentPosition = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeClock();
    initializeSidebar();
    startAutoRefresh();
    checkServerConnection();
});

// Update clock
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

// Initialize sidebar buttons
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

// Handle position button click
function handlePositionClick(positionId) {
    currentPosition = positionId;
    
    document.querySelectorAll('.position-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.positionId === positionId);
    });
    
    renderPositionContent();
}

// Render content for the selected position
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

// Render weather sections
function renderWeatherSections(weatherConfigs) {
    const container = document.getElementById('weather-sections');
    container.innerHTML = '';
    
    weatherConfigs.forEach(config => {
        const weatherBox = document.createElement('div');
        weatherBox.className = 'weather-box';
        weatherBox.dataset.airport = config.airport;
        
        weatherBox.innerHTML = `
            <div class="title">${config.label}</div>
            <div class="info">
                <div class="weather-placeholder">Weather data will be displayed here</div>
            </div>
        `;
        
        container.appendChild(weatherBox);
    });
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

// Clear main content
function clearMainContent() {
    document.getElementById('weather-sections').innerHTML = '';
    document.getElementById('departure-lists').innerHTML = '';
}

// Check server connection
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

// Update a single section
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

// Create a departure item
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

// Get current minute
function getCurrentMinute() {
    const now = new Date();
    return String(now.getUTCMinutes()).padStart(2, '0');
}

// Start auto-refresh
function startAutoRefresh() {
    refreshTimer = setInterval(() => {
        fetchDepartures();
        checkServerConnection();
    }, REFRESH_INTERVAL);
}

// Stop auto-refresh
function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

// Debounce helper
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