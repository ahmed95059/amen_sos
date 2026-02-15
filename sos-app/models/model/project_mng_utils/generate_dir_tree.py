import sys
from pathlib import Path

# === Auto-injected project root resolver ===
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import os



def generate_directory_tree(root_dir: str, output_file: str) -> None:
    """
    Generates a textual representation of the directory tree starting from root_dir
    and writes it to output_file, including icons for folders and files.

    Parameters:
    - root_dir (str): The root directory to scan.
    - output_file (str): Path to the output .txt file where the tree will be saved.
    """
    with open(output_file, 'w', encoding='utf-8') as f:
        for dirpath, dirnames, filenames in os.walk(root_dir):
            # Calculate indentation based on folder depth
            depth = dirpath.replace(root_dir, "").count(os.sep)
            indent = '    ' * depth
            folder_name = os.path.basename(dirpath)
            f.write(f"{indent}📁 {folder_name}/\n")

            subindent = '    ' * (depth + 1)
            for filename in filenames:
                f.write(f"{subindent}📄 {filename}\n")

if __name__ == "__main__":
    # Current script directory
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

    # Directory to scan = one level up
    ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

    # Output file inside the current script directory
    OUTPUT_FILE = os.path.join(SCRIPT_DIR, "SoulSketch_Full_Flow_DIR_TREE.txt")

    generate_directory_tree(ROOT_DIR, OUTPUT_FILE)
    print(f"Directory tree saved to: {OUTPUT_FILE}")
