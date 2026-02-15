import os

from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

from dotenv import load_dotenv
load_dotenv()

# Step 1: Setup Groq LLM
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL_NAME = "llama-3.1-8b-instant"  # Change to any supported Groq model


llm = ChatGroq(
    model=GROQ_MODEL_NAME,
    temperature=0.5,
    max_tokens=512,
    api_key=GROQ_API_KEY,
)


# Step 2: Connect LLM with FAISS and Create chain

# Load Database
DB_FAISS_PATH = "vectorstore/db_faiss"
embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
db = FAISS.load_local(DB_FAISS_PATH, embedding_model, allow_dangerous_deserialization=True)
retriever = db.as_retriever(search_kwargs={"k": 3})

# Step 3: Build RAG chain
retrieval_qa_chat_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful medical assistant. Base the answer strictly on the provided context."),
    ("system", "Context:\n{context}"),
    ("human", "{input}")
])


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



# Now invoke with a single query
user_query = input("Write Query Here: ").strip()
if not user_query:
    raise SystemExit("No query provided")

answer = rag_chain.invoke(user_query)
sources = retriever.invoke(user_query)

print("RESULT:\n", answer)
print("\nSOURCE DOCUMENTS:")
for doc in sources:
    preview = doc.page_content.replace("\n", " ")[:200]
    print(f"- {doc.metadata} -> {preview}...")
