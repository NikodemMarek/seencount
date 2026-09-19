import os
import subprocess
import json
from http.server import HTTPServer, SimpleHTTPRequestHandler

ENV_VARS = os.environ.copy()
BEANCOUNT_FILE = "locations.beancount"
TARGET_DIRECTORY = "."

ACCOUNTS_METADATA_COMMAND = "SELECT accounts, meta FROM #entries WHERE type = 'open' and accounts ~ 'Assets:Locations'"

def query_beancount(query: str):
    rledger_bin = os.environ.get("RUSTLEDGER", "/home/nikodem/projects/forks/rustledger/target/debug/rledger")
    result = subprocess.run(
        ["sh", "-c", f"\"{rledger_bin}\" query -f json {BEANCOUNT_FILE} \"{query}\""],
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
        "quantity": position["number"]
    } for position in balance_raw["rows"][0][1]["positions"]]

def handle():
    accounts_raw = query_beancount(ACCOUNTS_METADATA_COMMAND)
    accounts = [{
            **row[1],
            "id": row[0][0],
            "filename": None,
            "lineno": None,
            "contents": get_balance(row[0][0])
    } for row in accounts_raw.get("rows", [])]

    for account in accounts:
        del account["filename"]
        del account["lineno"]

    return accounts

def get_available_locations(target_directory):
    items = []

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
    "/favicon.ico",
    "/components/LocationItem.js",
    "/components/LocationSelector.js",
    "/components/BottomBar.js",
    "/components/AssetItemCard.js",
    "/components/AssetDrawer.js",
    "/components/AssetMap.js",
}

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=TARGET_DIRECTORY, **kwargs)

    def do_GET(self):
        clean_path = self.path.split('?')[0]

        if clean_path == '/metadata':
            response_data = handle()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            return

        if clean_path == '/locations':
            locations = get_available_locations(TARGET_DIRECTORY)
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

        available_locations = get_available_locations(TARGET_DIRECTORY)
        allowed_filenames = {loc["filename"] for loc in available_locations}

        if rel_filename == base_filename and base_filename in allowed_filenames:
            super().do_GET()
            return

        self.send_error(403, "Forbidden: Access restricted to allowed locations and static assets.")

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8000), CustomHandler)
    print(f"Serving {TARGET_DIRECTORY} on http://localhost:8000")
    server.serve_forever()

