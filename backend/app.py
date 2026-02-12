"""
VATSIM Departure List Backend
Flask server that receives aircraft state updates from EuroScope plugin
and serves departure list and weather data to the frontend.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone
import threading
import logging
import requests
from metar.Metar import Metar

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
METAR_CACHE_TTL = 300  # 5 minutes
AIRBORNE_CLEANUP_INTERVAL = 180  # 3 minutes (align with frontend display time)
AIRBORNE_RETENTION_TIME = 180  # 3 minutes (match frontend DEPARTED_DISPLAY_TIME)

# In-memory storage
# Structure: {airport_code: [{callsign, status, sid, timestamp, ...}]}
aircraft_data = {}

# METAR cache
# Structure: {airport: (timestamp, parsed_data)}
metar_cache = {}


# ============================================================================
# Aircraft Status Endpoints
# ============================================================================

@app.route('/api/status-update', methods=['POST'])
def status_update():
    """
    Receive aircraft status updates from EuroScope plugin.
    
    Expected JSON:
    {
        "callsign": "BAW123",
        "airport": "EGLL",
        "status": "STUP" | "PUSH" | "TAXI" | "DEPA" | "AIRBORNE" | "CLEAR",
        "sid": "BPK7G",
        "squawk": "1234",
        "route": "BPK L620 DVR"
    }
    """
    try:
        data = request.json
        callsign = data.get('callsign')
        airport = data.get('airport')
        status = data.get('status')
        
        if not all([callsign, airport, status]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        valid_statuses = ['STUP', 'PUSH', 'TAXI', 'DEPA', 'AIRBORNE', 'CLEAR']
        if status not in valid_statuses:
            return jsonify({'error': 'Invalid status'}), 400
        
        # Initialize airport list if needed
        if airport not in aircraft_data:
            aircraft_data[airport] = []
        
        # Find existing aircraft
        aircraft = next(
            (a for a in aircraft_data[airport] if a['callsign'] == callsign),
            None
        )
        
        # Handle CLEAR - remove aircraft
        if status == 'CLEAR':
            if aircraft:
                aircraft_data[airport] = [
                    a for a in aircraft_data[airport] 
                    if a['callsign'] != callsign
                ]
                logger.info(f"Removed {callsign} from {airport}")
            return jsonify({'success': True}), 200
        
        if aircraft:
            old_status = aircraft.get('status')
            
            if status == 'AIRBORNE':
                # Only update status and timestamp, preserve flight plan data
                aircraft['status'] = status
                aircraft['timestamp'] = datetime.now(timezone.utc).isoformat()
            else:
                # Full update for STUP, PUSH, TAXI, DEPA
                aircraft.update(data)
                if old_status != status:
                    aircraft['timestamp'] = datetime.now(timezone.utc).isoformat()
        else:
            # New aircraft - STUP, PUSH, TAXI, or DEPA can create entries
            if status in ['STUP', 'PUSH', 'TAXI', 'DEPA']:
                data['timestamp'] = datetime.now(timezone.utc).isoformat()
                aircraft_data[airport].append(data)
            else:
                # Ignore AIRBORNE for unknown aircraft
                logger.warning(
                    f"Received {status} for unknown aircraft {callsign}, ignoring"
                )
                return jsonify({
                    'success': False,
                    'error': 'Aircraft not tracked'
                }), 200
        
        logger.info(f"Updated {callsign} at {airport}: {status}")
        return jsonify({'success': True}), 200
        
    except Exception as e:
        logger.error(f"Error processing status update: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/departures', methods=['GET'])
def get_departures():
    """Get current departure list for all airports."""
    response = jsonify(aircraft_data)
    response.headers['Cache-Control'] = 'no-store'
    return response, 200


@app.route('/api/departures/<airport>', methods=['GET'])
def get_departures_by_airport(airport):
    """Get departure list for a specific airport."""
    response = jsonify(aircraft_data.get(airport.upper(), []))
    response.headers['Cache-Control'] = 'no-store'
    return response, 200

# ============================================================================
# Weather Endpoints
# ============================================================================

def fetch_metar(airport):
    """
    Fetch and parse METAR for an airport with caching.
    
    Args:
        airport: ICAO airport code
        
    Returns:
        dict: Parsed METAR data or None if unavailable
    """
    now = datetime.now(timezone.utc).timestamp()

    # Check cache
    if airport in metar_cache:
        cached_time, cached_data = metar_cache[airport]
        if now - cached_time < METAR_CACHE_TTL:
            return cached_data
        
    try:
        # Fetch from VATSIM with cache-busting
        response = requests.get(
            f'https://metar.vatsim.net/{airport}',
            params={'t': int(now)},
            headers={
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            timeout=5
        )

        if response.status_code != 200 or not response.text.strip():
            logger.warning(f"No METAR available for {airport}")
            return None
        
        raw = response.text.strip()
        obs = Metar(raw)

        # Parse time of issue
        toi = obs.time.strftime('%H%M') if obs.time else None

        # Parse wind
        wind_dir = obs.wind_dir.value() if obs.wind_dir else None
        wind_speed = obs.wind_speed.value('KT') if obs.wind_speed else None
        wind_gust = obs.wind_gust.value('KT') if obs.wind_gust else None
        wind_dir_from = obs.wind_dir_from.value() if obs.wind_dir_from else None
        wind_dir_to = obs.wind_dir_to.value() if obs.wind_dir_to else None

        # NCD (No Cloud Detected) is represented as [('NCD', None, None)]
        sky_clear = not obs.sky or (len(obs.sky) == 1 and obs.sky[0][0] == 'NCD')

        is_cavok = (
            obs.vis and obs.vis.value('M') >= 9999 and
            sky_clear and
            not obs.weather
        )
        
        if is_cavok:
            visibility = None
            clouds = []
            weather = None
        else:
            # Parse visibility
            visibility = None
            if obs.vis:
                vis_val = obs.vis.value('M')
                if vis_val >= 9999:
                    visibility = '10KM+'
                elif vis_val > 1000:
                    visibility = f'{int(vis_val/1000)}KM'
                else:
                    visibility = f'{int(vis_val)}M'

            # Parse cloud layers
            clouds = []
            for layer in obs.sky:
                cover, height, _ = layer
                if height:
                    clouds.append({
                        'cover': cover,
                        'height': int(height.value('FT'))
                    })

            # Parse weather
            weather = obs.present_weather() if obs.weather else None

        # Parse temperature and dewpoint
        temp = obs.temp.value('C') if obs.temp else None
        dewpoint = obs.dewpt.value('C') if obs.dewpt else None

        # Parse QNH
        qnh = None
        if obs.press:
            qnh = f'{int(obs.press.value("HPA"))}hPa'

        data = {
            'raw': raw,
            'airport': airport,
            'toi': toi,
            'cavok': is_cavok,
            'wind': {
                'direction': wind_dir,
                'speed': wind_speed,
                'gust': wind_gust,
                'variable_from': wind_dir_from,
                'variable_to': wind_dir_to
            },
            'visibility': visibility,
            'weather': weather,
            'clouds': clouds,
            'temp': temp,
            'dewpoint': dewpoint,
            'qnh': qnh
        }

        # Cache the result
        metar_cache[airport] = (now, data)
        logger.info(f"Fetched fresh METAR for {airport}")
        return data
        
    except Exception as e:
        logger.error(f"Error fetching METAR for {airport}: {e}", exc_info=True)
        return None

    
@app.route('/api/weather/<airport>', methods=['GET'])
def get_weather(airport):
    """Get parsed METAR data for an airport."""
    data = fetch_metar(airport.upper())
    
    if data is None:
        return jsonify({'error': 'Could not fetch METAR'}), 404
    
    response = jsonify(data)
    response.headers['Cache-Control'] = 'no-store'
    return response, 200


# ============================================================================
# Utility Endpoints
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now(timezone.utc).isoformat()
    }), 200


# ============================================================================
# Background Tasks
# ============================================================================

def auto_cleanup():
    """
    Background thread that removes old AIRBORNE aircraft from memory.
    Runs every 3 minutes and removes aircraft that have been AIRBORNE
    for more than 3 minutes (matching the frontend display window).
    """
    while True:
        threading.Event().wait(AIRBORNE_CLEANUP_INTERVAL)
        
        try:
            cutoff = datetime.now(timezone.utc).timestamp() - AIRBORNE_RETENTION_TIME
            removed_count = 0
            
            for airport in list(aircraft_data.keys()):
                original_count = len(aircraft_data[airport])
                
                aircraft_data[airport] = [
                    ac for ac in aircraft_data[airport]
                    if not (
                        ac.get('status') == 'AIRBORNE' and
                        datetime.fromisoformat(ac['timestamp']).timestamp() < cutoff
                    )
                ]
                
                removed = original_count - len(aircraft_data[airport])
                removed_count += removed
                
                # Clean up empty airport lists
                if len(aircraft_data[airport]) == 0:
                    del aircraft_data[airport]
            
            if removed_count > 0:
                logger.info(f"Auto cleanup removed {removed_count} aircraft")
                
        except Exception as e:
            logger.error(f"Error in auto cleanup: {e}", exc_info=True)


# ============================================================================
# Application Entry Point
# ============================================================================

if __name__ == '__main__':
    # Start background cleanup thread
    cleanup_thread = threading.Thread(target=auto_cleanup, daemon=True)
    cleanup_thread.start()
    
    logger.info("Starting VATSIM Departure List Server...")
    logger.info("Server running on http://0.0.0.0:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)