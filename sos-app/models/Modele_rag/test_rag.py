#!/usr/bin/env python
import os
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')

if not GROQ_API_KEY:
    print('✗ GROQ_API_KEY not found in .env')
    exit(1)

print('✓ GROQ_API_KEY loaded')
llm = ChatGroq(model='llama-3.1-8b-instant', temperature=0.5, max_tokens=512, api_key=GROQ_API_KEY)
print('✓ ChatGroq LLM initialized')

embedding_model = HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
print('✓ Embeddings model loaded')

db = FAISS.load_local('vectorstore/db_faiss', embedding_model, allow_dangerous_deserialization=True)
print('✓ FAISS vectorstore loaded')

retrieval_qa_chat_prompt = ChatPromptTemplate.from_messages([
    ('system', 'You are a helpful medical assistant. Answer questions based on the provided documents.'),
    ('human', '{input}')
])

# Simple RAG chain
from langchain_core.runnables import RunnablePassthrough

rag_chain = (
    RunnablePassthrough.assign(context=(lambda x: db.similarity_search(x["input"], k=3)) | (lambda docs: "\n".join([doc.page_content for doc in docs])))
    | retrieval_qa_chat_prompt
    | llm
    | StrOutputParser()
)
print('✓ RAG chain created (simple version)')

print('\n✓✓✓ All components initialized successfully! ✓✓✓')
print('\nYou can now run connect_memory_with_llm.py interactively')
