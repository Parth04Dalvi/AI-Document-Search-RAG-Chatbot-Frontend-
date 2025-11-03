import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, FileText, Loader, MessageSquare, Paperclip, AlertTriangle } from 'lucide-react';

// --- Configuration ---
const API_KEY = ""; // Canvas will automatically provide the key at runtime
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;
const CHUNK_SIZE = 1500; // Max characters per document chunk

// --- Utility Functions ---

/**
 * Implements exponential backoff for API calls.
 */
const fetchWithBackoff = async (url, options, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // If response is not OK, check for rate limiting or other server errors
                const errorBody = await response.json();
                console.error("API Error Body:", errorBody);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (error) {
            if (i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw new Error("API call failed after multiple retries. Check network or API key.");
            }
        }
    }
};

/**
 * Simulates document loading and chunking (RAG preparation).
 * In a real app, this would use a dedicated library (like LangChain) and a Vector DB.
 * For this demo, it's a simple text chunker.
 * @param {string} text - The full text content of the document.
 * @returns {string[]} An array of text chunks.
 */
const chunkDocument = (text) => {
    const chunks = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
        chunks.push(text.substring(i, i + CHUNK_SIZE));
    }
    return chunks;
};

// --- Main Application Component ---

const App = () => {
    const [documentText, setDocumentText] = useState(null); // Full text of the loaded document
    const [documentName, setDocumentName] = useState(null);
    const [chatHistory, setChatHistory] = useState([]); // { role: 'user' | 'model', text: string }
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Scroll to bottom whenever chat history updates
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    // --- File Handling ---

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.txt')) {
            setError("Only PDF or TXT files are supported for this simulation.");
            return;
        }

        // Use FileReader to simulate reading content (for PDF, this would be a library call)
        const reader = new FileReader();
        reader.onload = (e) => {
            // NOTE: PDF content is complex. This demo reads it as raw text.
            const textContent = e.target.result;
            setDocumentText(textContent);
            setDocumentName(file.name);
            setChatHistory([{ role: 'model', text: `Document "${file.name}" loaded successfully. You can now ask questions based on its content.` }]);
            setError(null);
        };
        reader.onerror = () => setError("Failed to read file.");
        reader.readAsText(file); // Reads as text (works for TXT; simulates PDF extraction)
    };
    
    const handleAttachmentClick = () => {
        fileInputRef.current.click();
    };

    // --- Chat & API Logic ---

    const sendMessage = useCallback(async () => {
        const userMessage = inputValue.trim();
        if (!userMessage || isLoading || !documentText) return;

        setInputValue('');
        setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);
        setError(null);
        
        // 1. RAG Simulation: Select relevant context chunks
        const documentChunks = chunkDocument(documentText);
        // For a demo, we simply use the first chunk as "context"
        // In a real RAG app, semantic search would select the most relevant chunks.
        const contextChunk = documentChunks[0]; 

        // 2. Construct the RAG Prompt
        const systemInstruction = `You are a RAG (Retrieval-Augmented Generation) Chatbot. Your task is to answer the user's question ONLY based on the provided DOCUMENT CONTEXT.
        If the answer is not found in the context, state clearly, "The answer is not available in the document context."

        DOCUMENT CONTEXT:
        ---
        ${contextChunk}
        ---`;

        const payload = {
            contents: [{ parts: [{ text: userMessage }] }],
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            },
        };

        try {
            const response = await fetchWithBackoff(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            const modelText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Error: Failed to get a response from the AI model.";
            
            setChatHistory(prev => [...prev, { role: 'model', text: modelText }]);
        } catch (e) {
            console.error("Chat API error:", e);
            setError("Could not connect to the AI service. Please check your network.");
            setChatHistory(prev => [...prev, { role: 'model', text: 'Sorry, I encountered a connection error while trying to generate a response.' }]);
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, isLoading, documentText]);

    // --- Render Helpers ---

    const renderMessage = (message, index) => (
        <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`max-w-3/4 p-3 rounded-xl shadow-md whitespace-pre-wrap 
                ${message.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                }`}
            >
                {message.text}
            </div>
        </div>
    );

    const isInputDisabled = isLoading || !documentText;

    // --- Main Render ---

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 font-sans antialiased">
            <header className="bg-white p-4 shadow-md flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <MessageSquare className="w-6 h-6 mr-3 text-blue-600" />
                    RAG Document Chatbot
                </h1>
                
                {/* Document Status */}
                <div className="flex items-center space-x-2">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept=".pdf,.txt"
                    />
                    <div 
                        className={`py-1 px-3 rounded-full text-sm font-medium transition-colors cursor-pointer flex items-center 
                            ${documentName 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                        onClick={handleAttachmentClick}
                    >
                        {documentName ? (
                            <>
                                <FileText className="w-4 h-4 mr-1" />
                                {documentName} (Ready)
                            </>
                        ) : (
                            <>
                                <Paperclip className="w-4 h-4 mr-1" />
                                Load Document
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-grow flex flex-col overflow-hidden">
                {/* Chat History Container */}
                <div 
                    ref={chatContainerRef} 
                    className="flex-grow p-4 space-y-4 overflow-y-auto bg-gray-50"
                >
                    {chatHistory.map(renderMessage)}

                    {/* Typing Indicator */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-3/4 p-3 rounded-xl bg-white text-gray-600 border border-gray-200 rounded-tl-none shadow-md flex items-center space-x-2">
                                <Loader className="w-4 h-4 animate-spin" />
                                <p>AI is thinking...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-500 text-white p-3 flex items-center justify-center text-sm font-medium">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        {error}
                    </div>
                )}
            </main>

            {/* Input Footer */}
            <footer className="bg-white p-4 border-t shadow-inner">
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={handleAttachmentClick}
                        className={`p-2 rounded-full transition-colors 
                            ${documentName ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'} 
                            disabled:opacity-50`}
                        title="Load New Document"
                    >
                        <Paperclip className="w-6 h-6" />
                    </button>
                    
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder={documentName ? "Ask a question about the document..." : "Please load a document first..."}
                        className="flex-grow p-3 border border-gray-300 rounded-full focus:ring-blue-500 focus:border-blue-500 transition-shadow disabled:bg-gray-100"
                        disabled={isInputDisabled}
                    />

                    <button
                        onClick={sendMessage}
                        className={`p-3 rounded-full transition-colors 
                            ${isInputDisabled || inputValue.trim() === '' 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'}`}
                        disabled={isInputDisabled || inputValue.trim() === ''}
                        title="Send Message"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default App;
