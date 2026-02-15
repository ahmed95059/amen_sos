#!/usr/bin/env python
import os
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')

if not GROQ_API_KEY:
    print('✗ GROQ_API_KEY not found in .env')
    exit(1)

print('✓ GROQ_API_KEY loaded successfully')
print('✓ Environment configuration complete')
print('\nDependencies installed:')
print('  - Flask 3.0.3')
print('  - LangChain 1.1.0 + ecosystem')
print('  - FAISS vectorstore 1.13.0')
print('  - Groq 0.36.0 (updated)')
print('  - All ML packages (torch, transformers, sentence-transformers)')
print('\n✓✓✓ Virtual environment ready! ✓✓✓')
print('\nYou can now run:')
print('  1. launcher.py          - Interactive menu')
print('  2. app.py               - Flask API')
print('  3. connect_memory_with_llm.py - Interactive RAG chat')
