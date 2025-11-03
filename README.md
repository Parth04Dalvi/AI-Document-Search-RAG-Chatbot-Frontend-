💬 AI Document Search (RAG Chatbot)

This project is a single-page React application that demonstrates the core architecture of a Retrieval-Augmented Generation (RAG) system. It allows users to upload a document (simulated PDF or TXT), which is then chunked and used as context to answer user questions via the Gemini LLM.

This is an essential portfolio piece for showcasing expertise in modern AI application development, semantic search principles, and robust front-end architecture.

✨ Key Features & Technical Highlights

Feature

Technical Skill Demonstrated

RAG Architecture Simulation

Implementation of chunking logic (CHUNK_SIZE), system prompting, and context injection to constrain the LLM's answers to the document's content.

Multimodal Input Handling

React state management for handling file uploads (.pdf / .txt), reading content via FileReader, and managing document state.

Robust API Consumption

Custom fetchWithBackoff utility function demonstrating exponential backoff for handling rate limiting and transient API errors.

Real-time Chat Interface

Responsive, modern chat UI built with React and Tailwind CSS, featuring automatic scrolling and an AI "typing" indicator.

Strict Context Adherence

LLM is instructed via the system prompt to only answer based on the provided document context, simulating the security and accuracy of RAG.

🛠️ Technology Stack

Frontend: React, Tailwind CSS, Lucide Icons

AI/LLM Core: Google Gemini API (gemini-2.5-flash-preview-09-2025)

Data Simulation: Vanilla JavaScript for in-browser document chunking and context management.

🚀 How to Use the Chatbot

Load Document: Click the "Load Document" button (paperclip icon) in the top-right corner. Upload a simple .txt file containing any technical or narrative text.

RAG Process: The application simulates chunking the document into manageable pieces for the LLM.

Ask a Question: Type a question into the input field that is directly related to the document's content.

Receive Answer: The AI will respond, using only the document's text for its answer. If the answer is not in the text, it will state that the information is unavailable.

⚙️ Architecture Simulation Details

In a full-scale RAG application, the process would typically involve a dedicated Vector Database (e.g., Pinecone, FAISS) and embedding models. In this demo, the core RAG steps are simulated within the browser:

Ingestion: Document content is loaded into the documentText state.

Chunking: The chunkDocument function breaks the text into fixed-size strings.

Retrieval (Simulated): Instead of running a vector search, the first text chunk is directly injected into the system prompt as the "DOCUMENT CONTEXT."

Generation: The LLM uses the provided context and the user's question to generate a grounded response.
