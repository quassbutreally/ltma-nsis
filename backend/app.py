from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone
import json
import threading

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

if __name__ == '__main__':
    cleanup_thread = threading.Thread(target=auto_cleanup, daemon=True)
    cleanup_thread.start()
    print("Starting VATSIM Departure List Server...")
    print("Server running on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)