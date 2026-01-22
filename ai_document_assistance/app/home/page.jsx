'use client';
import React, { useState, useRef, useEffect} from 'react';
import Sidebar from '../components/sidebar';
import Chat from '../components/Chat';
import ProtectedRoute from '../components/protectedRoute';
import { useAuth } from '../context/userContext';
import ChatHistory from '../components/chatHistory';

export default function AIDocAnalyzer() {
  const { user, token, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Loading states for all API calls
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingChatHistory, setLoadingChatHistory] = useState(false);
  const [loadingSendMessage, setLoadingSendMessage] = useState(false);
  const [loadingDeleteChat, setLoadingDeleteChat] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const token = sessionStorage.getItem('auth_token');
    const sessionId = sessionStorage.getItem('sessionId');

    if (!token || !sessionId) {
      console.error('Missing auth_token or sessionId');
      return;
    }

    setLoadingUpload(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('sessionId', sessionId);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      
      // Refresh document list after successful upload
      await fetchDocuments();

      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'system',
          content: `Successfully uploaded ${files.length} document(s). You can now ask questions about: ${files
            .map(f => f.name)
            .join(', ')}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'system',
          content: 'Document upload failed. Please try again.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoadingUpload(false);
      e.target.value = '';
    }
  };

  const fetchDocuments = async () => {
    const token = sessionStorage.getItem('auth_token');

    if (!token) {
      console.error('Missing auth_token');
      return;
    }

    setLoadingDocuments(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/documents/list`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch documents: ${res.status}`);
      }

      const data = await res.json();

      if (data.success && Array.isArray(data.documents)) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadSessionMessages = (session) => {
    if (!session || !Array.isArray(session.messages)) {
      console.error("Invalid session data", session);
      return;
    }

    const formattedMessages = session.messages.map((msg, index) => ({
      id: `${session.sessionId}-${index}`,
      type: msg.role === "user" ? "user" : "ai",
      content: msg.message,
      timestamp: new Date(msg.timestamp).toLocaleTimeString(),
    }));

    setMessages(formattedMessages);
    setShowHistory(false);
  };

  const loadChatHistory = async () => {
    const token = sessionStorage.getItem("auth_token");
    if (!token) {
      console.error("Missing auth_token");
      return;
    }

    setLoadingChatHistory(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/chat/all-history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch chat history: ${res.status}`);
      }

      const data = await res.json();
      
      if (Array.isArray(data)) {
        setChatHistory(data);
        setShowHistory(false);
      } else {
        console.error("Unexpected chat history response shape", data);
      }
    } catch (err) {
      console.error("Chat history fetch error:", err);
    } finally {
      setLoadingChatHistory(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    loadChatHistory();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loadingSendMessage) return;

    const token = sessionStorage.getItem("auth_token");
    const sessionId = sessionStorage.getItem("sessionId");

    if (!token || !sessionId) {
      console.error("Missing auth token or sessionId");
      return;
    }

    const userMsg = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoadingSendMessage(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/chat/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: userMsg.content,
          sessionId,
          topK: 5,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to get answer");
      }

      const aiMsg = {
        id: Date.now() + 1,
        type: "ai",
        content: data.answer || "I couldn't generate a response. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          content: "Something went wrong while answering your question. Please try again.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoadingSendMessage(false);
    }
  };

  const deleteChatSession = async (sessionId) => {
    const token = sessionStorage.getItem("auth_token");
    if (!token || !sessionId || loadingDeleteChat) return;

    setLoadingDeleteChat(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API}/chat/delete-chat?sessionId=${sessionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status}`);
      }
      
      setChatHistory((prev) =>
        prev.filter((chat) => chat.sessionId !== sessionId)
      );

      setMessages((prev) =>
        prev.length > 0 ? [] : prev
      );
    } catch (err) {
      console.error("Failed to delete chat session", err);
    } finally {
      setLoadingDeleteChat(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <Sidebar 
          showSidebar={showSidebar} 
          handleFileUpload={handleFileUpload} 
          fileInputRef={fileInputRef} 
          setDocuments={setDocuments} 
          documents={documents} 
          startNewChat={startNewChat}
          loadingUpload={loadingUpload}
          loadingDocuments={loadingDocuments}
        />
        <Chat 
          setShowSidebar={setShowSidebar} 
          showSidebar={showSidebar} 
          setShowHistory={setShowHistory} 
          showHistory={showHistory} 
          messages={messages} 
          messagesEndRef={messagesEndRef} 
          setInputMessage={setInputMessage} 
          handleSendMessage={handleSendMessage} 
          inputMessage={inputMessage} 
          logout={logout}
          loadingSendMessage={loadingSendMessage}
        />
        {showHistory && (
          <ChatHistory
            setShowHistory={setShowHistory}
            loadChatHistory={loadChatHistory}
            loadSessionMessages={loadSessionMessages}
            deleteChatSession={deleteChatSession}
            chatHistory={chatHistory}
            loadingChatHistory={loadingChatHistory}
            loadingDeleteChat={loadingDeleteChat}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
