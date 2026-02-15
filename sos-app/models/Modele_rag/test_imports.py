#!/usr/bin/env python
"""
Comprehensive import test for all project dependencies
"""
import sys

def test_import(module_name, package_display_name=None):
    """Test if a module can be imported"""
    display_name = package_display_name or module_name
    try:
        __import__(module_name)
        print(f"✓ {display_name}")
        return True
    except ImportError as e:
        print(f"✗ {display_name}: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("Testing All Project Dependencies")
    print("=" * 60)
    
    tests = [
        # Web Framework
        ("flask", "Flask 3.0.3"),
        ("flask_cors", "Flask-CORS 4.0.1"),
        ("werkzeug", "Werkzeug (Flask dependency)"),
        
        # Frontend
        ("streamlit", "Streamlit 1.40.1"),
        
        # Config
        ("dotenv", "python-dotenv 1.0.1"),
        
        # HTTP & Async
        ("requests", "Requests 2.32.5"),
        ("httpx", "HTTPX 0.28.1"),
        ("aiohttp", "aiohttp 3.13.2"),
        
        # Groq API
        ("groq", "Groq 0.36.0"),
        
        # LangChain Core
        ("langchain_core", "LangChain Core 1.1.0"),
        ("langchain", "LangChain 1.1.0"),
        ("langchain_community", "LangChain Community 0.4.1"),
        ("langchain_groq", "LangChain Groq 1.1.0"),
        ("langchain_huggingface", "LangChain HuggingFace 1.1.0"),
        ("langchain_text_splitters", "LangChain Text Splitters 1.0.0"),
        ("langchainhub", "LangChain Hub 0.1.21"),
        ("langsmith", "LangSmith 0.4.49"),
        ("langgraph", "LangGraph 1.0.4"),
        
        # Vector Store & Embeddings
        ("faiss", "FAISS 1.13.0"),
        ("sentence_transformers", "Sentence Transformers 5.1.2"),
        ("huggingface_hub", "HuggingFace Hub 0.36.0"),
        
        # ML & Data Processing
        ("transformers", "Transformers 4.57.3"),
        ("torch", "PyTorch 2.9.1"),
        ("numpy", "NumPy 2.3.5"),
        ("pandas", "Pandas 2.3.3"),
        ("scipy", "SciPy 1.16.3"),
        ("sklearn", "Scikit-learn 1.7.2"),
        
        # Data Format
        ("pypdf", "PyPDF 6.4.0"),
        ("yaml", "PyYAML 6.0.3"),
        
        # Database
        ("sqlalchemy", "SQLAlchemy 2.0.44"),
        
        # Utilities
        ("pydantic", "Pydantic 2.12.5"),
        ("tenacity", "Tenacity 9.1.2"),
        ("tqdm", "TQDM 4.67.1"),
        ("PIL", "Pillow 11.3.0"),
    ]
    
    passed = 0
    failed = 0
    
    print()
    for module_name, display_name in tests:
        if test_import(module_name, display_name):
            passed += 1
        else:
            failed += 1
    
    print()
    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed out of {len(tests)} tests")
    print("=" * 60)
    
    if failed == 0:
        print("\n✓✓✓ All dependencies imported successfully! ✓✓✓")
        return 0
    else:
        print(f"\n✗ {failed} import(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
