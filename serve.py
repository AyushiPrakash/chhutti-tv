# Local dev server that never lets the browser cache files, so edits always show on refresh.
# Used when Node is not installed: python3 serve.py
import http.server, socketserver

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', 3000), NoCache) as httpd:
    print('Serving on http://localhost:3000')
    httpd.serve_forever()
