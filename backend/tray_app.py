"""
VATSIM Departure List - System Tray Application
Runs Flask backend in background with system tray control
"""

import sys
import os
import threading
import webbrowser
import time
from pystray import Icon, Menu, MenuItem
from PIL import Image, ImageDraw
import logging

# Import the Flask app
from app import app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Flask server thread
flask_thread = None
server_running = False


def get_resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller"""
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    
    return os.path.join(base_path, relative_path)


def create_icon_image():
    """Create a simple icon image"""
    width = 64
    height = 64
    image = Image.new('RGB', (width, height), color='black')
    draw = ImageDraw.Draw(image)
    
    # Draw a simple airplane-like shape
    draw.rectangle([20, 28, 44, 36], fill='white')  # Fuselage
    draw.rectangle([10, 30, 54, 34], fill='white')  # Wings
    draw.rectangle([40, 22, 44, 40], fill='white')  # Tail
    
    return image


def run_flask():
    """Run Flask server in background"""
    global server_running
    try:
        logger.info("Starting Flask server...")
        server_running = True
        
        # Set the static folder to the bundled frontend
        frontend_path = get_resource_path('frontend')
        app.static_folder = frontend_path
        app.template_folder = frontend_path
        
        logger.info(f"Serving frontend from: {frontend_path}")
        
        app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
    except Exception as e:
        logger.error(f"Flask server error: {e}")
        server_running = False


def open_dashboard(icon, item):
    """Open the dashboard in default browser"""
    logger.info("Opening dashboard...")
    webbrowser.open('http://localhost:5000')


def restart_server(icon, item):
    """Restart the Flask server"""
    logger.info("Restarting server...")
    icon.notify("Please restart the application to restart the server", "VATSIM Departure List")


def quit_app(icon, item):
    """Quit the application"""
    logger.info("Shutting down...")
    icon.notify("Shutting down...", "VATSIM Departure List")
    global server_running
    server_running = False
    icon.stop()
    sys.exit(0)


def main():
    """Main entry point"""
    global flask_thread
    
    # Start Flask server in background thread
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    
    # Wait a moment for server to start
    time.sleep(2)
    
    # Open dashboard automatically
    logger.info("Opening dashboard...")
    webbrowser.open('http://localhost:5000')
    
    # Create system tray icon
    icon_image = create_icon_image()
    menu = Menu(
        MenuItem('Open Dashboard', open_dashboard, default=True),
        MenuItem('Restart Server', restart_server),
        Menu.SEPARATOR,
        MenuItem('Exit', quit_app)
    )
    
    icon = Icon(
        "VATSIM Departure List",
        icon_image,
        "VATSIM Departure List",
        menu
    )
    
    logger.info("System tray app running")
    icon.run()


if __name__ == '__main__':
    main()