"""Serve the teammate's OHIF viewer on http://127.0.0.1:3000.

Browsers on this PC cannot open the Tailscale address directly, but normal
programs can. This relay forwards every request to the upstream OHIF server and
streams the response back unchanged, so the browser only talks to localhost.

Usage (from the repository root):
    backend\\.venv\\Scripts\\python.exe scripts\\ohif-relay.py

Environment:
    OHIF_UPSTREAM   upstream OHIF base URL (default http://100.97.193.98:3000)
    OHIF_RELAY_PORT local port (default 3000)
"""

import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

UPSTREAM = os.getenv("OHIF_UPSTREAM", "http://100.97.193.98:3000").rstrip("/")
PORT = int(os.getenv("OHIF_RELAY_PORT", "3000"))

# Hop-by-hop headers are per connection and must not be forwarded.
HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "host",
}

# BaseHTTPRequestHandler sends its own Server and Date headers.
SKIP_RESPONSE = HOP_BY_HOP | {"content-length", "server", "date"}

HEALTH_PATH = "/__relay/health"

session = requests.Session()
session.mount(
    "http://",
    HTTPAdapter(
        pool_maxsize=32,
        max_retries=Retry(
            total=3,
            backoff_factor=0.3,
            status_forcelist=(502, 503, 504),
            allowed_methods=("GET", "HEAD", "OPTIONS"),
        ),
    ),
)


class RelayHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _send_plain(self, status: int, body: bytes, content_type: str, extra=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        for name, value in (extra or {}).items():
            self.send_header(name, value)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _health(self):
        """Readable cross-origin by the Medic frontend (OHIF itself is not)."""
        try:
            # One quick try without retries, so the UI learns fast when the
            # OHIF host is offline.
            ok = requests.get(f"{UPSTREAM}/", timeout=(3, 5)).ok
        except requests.RequestException:
            ok = False
        body = (b'{"relay":true,"upstream":%s}' % (b"true" if ok else b"false"))
        self._send_plain(
            200 if ok else 502,
            body,
            "application/json",
            {"Access-Control-Allow-Origin": "*", "Cache-Control": "no-store"},
        )

    def _relay(self):
        if self.path.split("?")[0] == HEALTH_PATH:
            self._health()
            return

        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None
        headers = {
            name: value
            for name, value in self.headers.items()
            if name.lower() not in HOP_BY_HOP
        }

        try:
            upstream = session.request(
                self.command,
                f"{UPSTREAM}{self.path}",
                headers=headers,
                data=body,
                stream=True,
                allow_redirects=False,
                timeout=(10, 60),
            )
        except requests.RequestException as error:
            message = (
                f"OHIF relay could not reach {UPSTREAM}. Is the viewer host on "
                f"and Tailscale connected? ({error.__class__.__name__})"
            ).encode()
            self._send_plain(502, message, "text/plain; charset=utf-8")
            return

        with upstream:
            # Pass the bytes through exactly as sent (keeps gzip encoding).
            content = upstream.raw.read(decode_content=False)

            self.send_response(upstream.status_code)
            for name, value in upstream.headers.items():
                if name.lower() in SKIP_RESPONSE:
                    continue
                self.send_header(name, value)
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()

            if self.command != "HEAD":
                self.wfile.write(content)

    def _handle(self):
        try:
            self._relay()
        except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
            # The browser gave up on the request (navigated away, timed out).
            self.close_connection = True

    do_GET = do_HEAD = do_POST = do_PUT = do_DELETE = do_OPTIONS = do_PATCH = _handle

    def log_message(self, format, *args):
        sys.stdout.write(f"[ohif-relay] {self.command} {self.path} {args[1] if len(args) > 1 else ''}\n")


def main():
    server = ThreadingHTTPServer(("127.0.0.1", PORT), RelayHandler)
    print(f"OHIF relay: http://localhost:{PORT} -> {UPSTREAM}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
