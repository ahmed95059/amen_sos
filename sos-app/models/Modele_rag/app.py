from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os

load_dotenv(override=True)
print("GROQ_API_KEY loaded:", bool(os.getenv("GROQ_API_KEY")))

from pathlib import Path
# LangChain imports
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from flask_cors import CORS



app = Flask(__name__)
CORS(app)  
# Configuration
DB_FAISS_PATH = "vectorstore/db_faiss"

# Charger la base FAISS une seule fois
def get_vectorstore():
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db = FAISS.load_local(DB_FAISS_PATH, embedding_model, allow_dangerous_deserialization=True)
    return db

vectorstore = get_vectorstore()
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# Initialiser le modèle Groq
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
print("GROQ_API_KEY:", GROQ_API_KEY)
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY n'est pas défini dans l'environnement (.env)")

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.5,
    max_tokens=512,
    api_key=GROQ_API_KEY,
)

# Prompt RAG
retrieval_qa_chat_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful medical assistant. Base your answer on the provided context."),
    ("system", "Context:\n{context}"),
    ("human", "{input}")
])

# Créer la chaîne RAG
def _format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

rag_chain = (
    {
        "context": retriever | RunnableLambda(_format_docs),
        "input": RunnablePassthrough(),
    }
    | retrieval_qa_chat_prompt
    | llm
    | StrOutputParser()
)


conversation_history = []  # stocke les messages entre le user et le bot

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()
        frontend_history = data.get("conversationHistory", [])
        print("Message reçu :", user_message)

        if not user_message:
            return jsonify({"error": "Aucun message reçu."}), 400

        # Fusionner l'historique du frontend avec celui du serveur
        for msg in frontend_history:
            if msg not in conversation_history:
                conversation_history.append({"role": msg["role"], "message": msg["content"]})

        # Ajouter le message utilisateur actuel
        conversation_history.append({"role": "user", "message": user_message})

        # Construire le contexte des 5 derniers messages
        previous_context = "\n".join(
            [f"{msg['role'].capitalize()}: {msg['message']}" for msg in conversation_history[-5:]]
        )

        # Exécution du RAG
        rag_input = f"{previous_context}\nUser: {user_message}".strip()
        answer = rag_chain.invoke(rag_input)
        source_docs = retriever.invoke(rag_input)

        # Ajouter réponse modèle
        conversation_history.append({"role": "assistant", "message": answer})

        return jsonify({
            "response": answer,
            "conversation_history": conversation_history[-10:],
            "sources": [
                {
                    "metadata": doc.metadata,
                    "preview": doc.page_content[:200],
                }
                for doc in source_docs
            ],
        })

    except Exception as e:
        print("Erreur serveur :", e)
        return jsonify({"error": str(e)}), 500



@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "clsAPI RAG + Groq opérationnelle sur /chat"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True) 
