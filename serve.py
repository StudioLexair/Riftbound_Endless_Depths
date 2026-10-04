#!/usr/bin/env python3
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os, mimetypes, webbrowser
mimetypes.add_type('text/javascript','.js')
mimetypes.add_type('application/manifest+json','.webmanifest')
os.chdir(Path(__file__).resolve().parent)
print('Riftbound: http://localhost:8080 · Ctrl+C para salir')
print('Solo localhost tiene contexto seguro sin HTTPS. La instalación móvil requiere alojamiento HTTPS.')
webbrowser.open('http://localhost:8080')
ThreadingHTTPServer(('127.0.0.1',8080), SimpleHTTPRequestHandler).serve_forever()
