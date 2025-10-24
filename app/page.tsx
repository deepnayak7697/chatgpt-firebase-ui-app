"use client";

import { useState, useRef } from 'react';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Convert file list to array for state management
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files).slice(0, 4); // limit to 4 images to avoid huge payloads
      setFiles(fileArray);
    }
  };

  // Helper to convert File -> base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const sendMessage = async () => {
    if ((input.trim() === '' && files.length === 0) || isSending) return;
    setIsSending(true);

    // Convert image files to base64
    const base64Images = await Promise.all(files.map((file) => fileToBase64(file)));

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      images: base64Images.length > 0 ? base64Images : undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setFiles([]);

    try {
      // Call API with conversation history including new user message
      const body = JSON.stringify({ messages: [...messages, userMessage] });
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const data = await res.json();
      if (data.reply) {
        const assistantMessage: ChatMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.reply,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        // Speak the assistant message if available
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(data.reply);
          window.speechSynthesis.speak(utter);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Voice recognition: start/stop functions
  const startRecording = () => {
    if (isRecording) return;
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition not supported in this browser');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // set default language to Hindi; adjust to user locale if needed
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onstart = () => {
      setIsRecording(true);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    recognition.onerror = () => {
      setIsRecording(false);
    };
    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <main className="flex flex-col flex-1 mx-auto w-full max-w-3xl shadow sm:rounded-lg overflow-hidden">
      {/* Top header bar with a colourful gradient similar to Firebase console */}
      <header className="p-4 text-center text-xl font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500">
        ChatGPT Pro Media
      </header>
      {/* Chat area on a light canvas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`rounded-lg p-3 max-w-[80%] whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white self-end'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {msg.images && msg.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {msg.images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`uploaded image ${i}`}
                      className="max-w-[150px] max-h-[150px] object-contain rounded border border-gray-300"
                    />
                  ))}
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex items-center space-x-2 mt-2 text-gray-600">
            <span className="animate-spin h-5 w-5 border-b-2 border-gray-500 rounded-full"></span>
            <span>Generating response...</span>
          </div>
        )}
      </div>
      {/* Input area */}
      <div className="p-4 bg-gray-100 flex flex-col sm:flex-row sm:items-center gap-2 border-t border-gray-200">
        <div className="flex flex-row gap-2">
          {/* File upload button */}
          <label className="flex items-center gap-1 text-gray-600 cursor-pointer hover:text-gray-800">
            📎
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          {/* Voice recording button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`text-xl px-3 py-1 rounded-lg transition-colors text-white ${
              isRecording ? 'bg-red-600' : 'bg-green-600'
            }`}
          >
            {isRecording ? '◼︎' : '🎤'}
          </button>
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 rounded-lg bg-white text-gray-800 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={(input.trim() === '' && files.length === 0) || isSending}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold"
        >
          Send
        </button>
      </div>
      {/* Preview of selected images below input */}
      {files.length > 0 && (
        <div className="p-4 bg-gray-100 border-t border-gray-200 flex flex-wrap gap-2">
          {files.map((file, idx) => (
            <div key={idx} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt="preview"
                className="w-20 h-20 object-cover rounded border border-gray-300"
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}