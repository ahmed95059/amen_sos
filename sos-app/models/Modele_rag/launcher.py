#!/usr/bin/env python3
"""
Medical Chatbot Launcher
Provides an interactive menu to run different components of the medical chatbot application.
"""

import subprocess
import sys
from pathlib import Path

def print_banner():
    """Print the launcher banner."""
    print("\n" + "="*60)
    print("   MEDICAL CHATBOT LAUNCHER".center(60))
    print("="*60 + "\n")

def print_menu():
    """Print the main menu."""
    print("Select an option:")
    print("  1. Run Flask API Server (app.py)")
    print("  2. Create Memory for LLM (create_memory_for_llm.py)")
    print("  3. Connect Memory with LLM (connect_memory_with_llm.py)")
    print("  4. Exit")
    print()

def run_flask():
    """Run the Flask API server."""
    print("\n" + "="*60)
    print("Starting Flask API Server...".center(60))
    print("="*60)
    print("The API will be available at: http://localhost:5000")
    print("Press Ctrl+C to stop the server.\n")
    try:
        subprocess.run([sys.executable, "app.py"])
    except KeyboardInterrupt:
        print("\n\nFlask server stopped.")

def run_create_memory():
    """Run the create memory script."""
    print("\n" + "="*60)
    print("Creating Memory for LLM...".center(60))
    print("="*60 + "\n")
    try:
        subprocess.run([sys.executable, "create_memory_for_llm.py"])
    except KeyboardInterrupt:
        print("\n\nMemory creation stopped.")
    except Exception as e:
        print(f"Error: {e}")

def run_connect_memory():
    """Run the connect memory script."""
    print("\n" + "="*60)
    print("Connecting Memory with LLM...".center(60))
    print("="*60 + "\n")
    try:
        subprocess.run([sys.executable, "connect_memory_with_llm.py"])
    except KeyboardInterrupt:
        print("\n\nMemory connection stopped.")
    except Exception as e:
        print(f"Error: {e}")

def main():
    """Main launcher loop."""
    print_banner()
    
    while True:
        print_menu()
        try:
        choice = input("Enter your choice (1-5): ").strip()
        
        if choice == "1":
            run_flask()
        elif choice == "2":
            run_create_memory()
        elif choice == "3":
            run_connect_memory()
        elif choice == "4":
            print("\nExiting Medical Chatbot Launcher. Goodbye!")
            break
        else:
            print("Invalid choice. Please select 1-4.\n")
    except KeyboardInterrupt:
            print("\n\nExiting Medical Chatbot Launcher. Goodbye!")
            break
        except Exception as e:
            print(f"Error: {e}\n")

if __name__ == "__main__":
    main()
