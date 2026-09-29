import os
import subprocess
import json
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

ENV_VARS = os.environ.copy()
ASSET_DIR = os.environ.get("ASSET_DIR", os.environ.get("ASSETS_DIR", "."))
PROGRAM_DIR = os.environ.get("PROGRAM_DIR", os.environ.get("STATIC_DIR", os.environ.get("WEB_DIR", ".")))

BEANCOUNT_FILE = os.environ.get("BEANCOUNT_FILE", os.path.join(ASSET_DIR, "locations.beancount"))

ACCOUNTS_METADATA_COMMAND = "SELECT accounts, meta FROM #entries WHERE type = 'open' and accounts ~ 'Assets:Locations'"

def query_beancount(query: str):
    rledger_bin = os.environ.get("RUSTLEDGER", "rledger")
    result = subprocess.run(
        ["sh", "-c", f"\"{rledger_bin}\" query -f json \"{BEANCOUNT_FILE}\" \"{query}\""],
        capture_output=True,
        text=True
    )

    return json.loads(result.stdout.strip())

def get_balance(account):
    balance_raw = query_beancount(f"BALANCES WHERE account = '{account}'")
    if len(balance_raw.get("rows", [])) == 0:
        return []
    return [{
        "asset": position["currency"],
        "quantity": float(position["number"])
    } for position in balance_raw["rows"][0][1]["positions"]]

def handle():
    accounts_raw = query_beancount(ACCOUNTS_METADATA_COMMAND)
    accounts = {row[0][0]: {
            **row[1],
            "id": row[0][0],
            "filename": None,
            "lineno": None,
            "contents": get_balance(row[0][0])
    } for row in accounts_raw.get("rows", [])}

    for data in accounts.values():
        del data["filename"]
        del data["lineno"]

    return accounts

def get_available_locations(target_directory):
    items = []

    if not os.path.exists(target_directory):
        return items

    for filename in os.listdir(target_directory):
        if not filename.endswith(".json"):
            continue

        filepath = os.path.join(target_directory, filename)
        if not os.path.isfile(filepath):
            continue

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, OSError):
            continue

        if not (isinstance(data, dict) and data.get("type") == "FeatureCollection"):
            continue

        fallback_name = (
            filename[:-5].replace("_", " ").title()
        )

        items.append(
            {
                "filename": filename,
                "data": data,
                "beancount_id": data.get("properties", {}).get("beancount_id"),
                "name": data.get("name") or fallback_name,
            }
        )

    return items

ALLOWED_STATIC_FILES = {
    "/",
    "/index.html",
    "/script.js",
    "/style.css",
    "/favicon.ico"
}

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROGRAM_DIR, **kwargs)

    def do_GET(self):
        clean_path = self.path.split('?')[0]

        if clean_path == '/assets':
            response_data = handle()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            return

        if clean_path == '/locations':
            locations = get_available_locations(ASSET_DIR)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(locations).encode('utf-8'))
            return

        if clean_path in ALLOWED_STATIC_FILES:
            super().do_GET()
            return

        rel_filename = clean_path.lstrip('/')
        base_filename = os.path.basename(rel_filename)

        available_locations = get_available_locations(ASSET_DIR)
        allowed_filenames = {loc["filename"] for loc in available_locations}

        if rel_filename == base_filename and base_filename in allowed_filenames:
            filepath = os.path.join(ASSET_DIR, base_filename)
            if os.path.isfile(filepath):
                try:
                    with open(filepath, 'rb') as f:
                        content = f.read()
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Content-Length", str(len(content)))
                    self.end_headers()
                    self.wfile.write(content)
                    return
                except OSError:
                    pass

        self.send_error(403, "Forbidden: Access restricted to allowed locations and static assets.")

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    server = HTTPServer(('0.0.0.0', port), CustomHandler)
    print(f"Serving program from {PROGRAM_DIR} and assets from {ASSET_DIR} on http://localhost:{port}")
    server.serve_forever()


