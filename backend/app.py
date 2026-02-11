from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone
import threading
import requests
from metar.Metar import Metar

app = Flask(__name__)
CORS(app)  # Enable CORS for local development

# In-memory storage for aircraft data
# Structure: {airport_code: [{callsign, status, sid, airborne_time, ...}]}
aircraft_data = {}

@app.route('/api/status-update', methods=['POST'])
def status_update():
    """
    Receive aircraft status updates from EuroScope plugin
    Expected JSON format:
    {
        "callsign": "BAW123",
        "airport": "EGLL",
        "status": "TAXI" or "DEPA",
        "sid": "BPK7G",
        "squawk": "1234",
        "route": "BPK L620 DVR",
        "airborne": "false"
    }
    """
    try:
        data = request.json
        callsign = data.get('callsign')
        airport = data.get('airport')
        status = data.get('status')
        
        if not all([callsign, airport, status]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if airport not in aircraft_data:
            aircraft_data[airport] = []
        
        aircraft = next((a for a in aircraft_data[airport] if a['callsign'] == callsign), None)
        
        if aircraft:
            old_status = aircraft.get('status')
            
            if status == 'AIRBORNE':
                # Only update status and timestamp, preserve all flight plan data
                aircraft['status'] = status
                aircraft['timestamp'] = datetime.now(timezone.utc).isoformat()
            else:
                # Full update for TAXI and DEPA
                aircraft.update(data)
                if old_status != status:
                    aircraft['timestamp'] = datetime.now(timezone.utc).isoformat()
        else:
            # New aircraft - only TAXI or DEPA should create new entries
            if status in ['TAXI', 'DEPA']:
                data['timestamp'] = datetime.now(timezone.utc).isoformat()
                aircraft_data[airport].append(data)
            else:
                # Ignore AIRBORNE for unknown aircraft
                print(f"Received {status} for unknown aircraft {callsign}, ignoring")
                return jsonify({'success': False, 'error': 'Aircraft not found'}), 404
        
        print(f"Updated {callsign} at {airport}: {status}")
        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"Error processing update: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/departures', methods=['GET'])
def get_departures():
    """
    Get current departure list for all airports
    Frontend will poll this endpoint
    """
    return jsonify(aircraft_data), 200


@app.route('/api/departures/<airport>', methods=['GET'])
def get_departures_by_airport(airport):
    """
    Get departure list for a specific airport
    """
    return jsonify(aircraft_data.get(airport, [])), 200


@app.route('/api/clear', methods=['POST'])
def clear_data():
    """
    Clear all aircraft data (useful for testing)
    """
    global aircraft_data
    aircraft_data = {}
    return jsonify({'success': True}), 200


@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()}), 200

@app.route('/api/cleanup', methods=['POST'])
def cleanup():
    """
    Remove AIRBORNE aircraft older than 10 minutes from memory
    Called periodically or manually
    """
    cutoff = datetime.utcnow().timestamp() - 600  # 10 minutes
    
    for airport in aircraft_data:
        aircraft_data[airport] = [
            ac for ac in aircraft_data[airport]
            if not (
                ac.get('status') == 'AIRBORNE' and
                datetime.fromisoformat(ac['timestamp']).timestamp() < cutoff
            )
        ]
    
    return jsonify({'success': True}), 200

def auto_cleanup():
    while True:
        threading.Event().wait(300)  # Every 5 minutes
        with app.app_context():
            for airport in aircraft_data:
                cutoff = datetime.utcnow().timestamp() - 600
                aircraft_data[airport] = [
                    ac for ac in aircraft_data[airport]
                    if not (
                        ac.get('status') == 'AIRBORNE' and
                        datetime.fromisoformat(ac['timestamp']).timestamp() < cutoff
                    )
                ]
            print("Auto cleanup complete")

# METAR cache
# Structure: {airport: (timestamp, parsed_data)}
metar_cache = {}
METAR_CACHE_TTL = 300  # 5 minutes

def fetch_metar(airport):
    """Fetch and parse METAR for an airport, with caching"""
    now = datetime.now(timezone.utc).timestamp()

    if airport in metar_cache:
        cached_time, cached_data = metar_cache[airport]

        if now - cached_time < METAR_CACHE_TTL:
            return cached_data
        
    try:
        response = requests.get(
            f'https://metar.vatsim.net/metar.php?id={airport}',
            timeout=5
        )

        if response.status_code != 200 or not response.text.strip():
            return None
        
        raw = response.text.strip()
        obs = Metar(raw)

        toi = obs.time.strftime('%H%M') if obs.time else None

        # Parse wind
        wind_dir = obs.wind_dir.value() if obs.wind_dir else None
        wind_speed = obs.wind_speed.value('KT') if obs.wind_speed else None
        wind_gust = obs.wind_gust.value('KT') if obs.wind_gust else None
        wind_dir_from = obs.wind_dir_from.value() if obs.wind_dir_from else None
        wind_dir_to = obs.wind_dir_to.value() if obs.wind_dir_to else None

        if obs.vis and obs.vis.value('M') >= 9999 and not obs.sky and not obs.weather:
            visibility = 'CAVOK'
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
                cover, height, special = layer
                if height:
                    clouds.append({
                        'cover': cover,
                        'height': int(height.value('FT'))
                    })

            # Parse weather
            weather = obs.present_weather() if obs.weather else None

        # Parse temp/dewpoint
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
            'cavok': visibility == 'CAVOK',
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

        metar_cache[airport] = (now, data)
        return data
        
    except Exception as e:
        print(f"Error fetching METAR for {airport}: {e}")
        return None
    
@app.route('/api/weather/<airport>', methods=['GET'])
def get_weather(airport):
    """Get parsed METAR data for an airport"""
    data = fetch_metar(airport.upper())
    
    if data is None:
        return jsonify({'error': 'Could not fetch METAR'}), 404
    
    return jsonify(data), 200
        

if __name__ == '__main__':
    cleanup_thread = threading.Thread(target=auto_cleanup, daemon=True)
    cleanup_thread.start()
    print("Starting VATSIM Departure List Server...")
    print("Server running on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)