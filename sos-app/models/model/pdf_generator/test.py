from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent
print("BASE_DIR:", BASE_DIR)
ROOT = BASE_DIR.parent
print("ROOT:", ROOT)
SHARED = ROOT / "shared_memory"
print("SHARED:", SHARED)
ASSETS = ROOT / "pdf_generator" / "assets"
print("ASSETS:", ASSETS)