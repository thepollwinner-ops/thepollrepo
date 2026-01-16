#!/usr/bin/env python3
import http.server
import socketserver
import os
from pathlib import Path

PORT = 5000
DIRECTORY = "/app/admin-panel/build"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()
    
    def do_GET(self):
        # Serve index.html for all routes (SPA fallback)
        if not os.path.exists(self.translate_path(self.path)):
            self.path = '/index.html'
        return super().do_GET()

os.chdir(DIRECTORY)
with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"Admin Panel Server running at http://0.0.0.0:{PORT}")
    print(f"Serving directory: {DIRECTORY}")
    httpd.serve_forever()
