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
  const [loadingNewChat, setLoadingNewChat] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

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
    let sessionId = sessionStorage.getItem('sessionId');

    if (!token) {
      console.error('Missing auth_token');
      setErrorMessage('You must be logged in to upload documents.');
      return;
    }

    // if (!sessionId) {
    //   try {
    //     const newSessionRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/chat/new-session`, {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer ${token}`,
    //       },
    //     });

    //     const newSessionData = await newSessionRes.json();
        
    //     if (!newSessionRes.ok || !newSessionData.success) {
    //       if (newSessionRes.status === 403) {
    //         setErrorMessage(newSessionData.error || "You cannot upload documents. Please contact support.");
    //         return;
    //       }
    //       throw new Error(newSessionData.error || "Failed to create new chat session");
    //     }

    //     sessionId = newSessionData.sessionId;
    //     sessionStorage.setItem("sessionId", sessionId);
    //   } catch (err) {
    //     console.error("Failed to create new session:", err);
    //     setErrorMessage(err.message || "Failed to create a new chat session. Please try again.");
    //     return;
    //   }
    // }

    setLoadingUpload(true);
    setErrorMessage(null);
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
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 403) {
          setErrorMessage(errorData.error || "You cannot upload documents. Your account may be inactive.");
          return;
        }
        throw new Error(errorData.error || `Upload failed with status ${res.status}`);
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
      setErrorMessage(err.message || 'Document upload failed. Please try again.');
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

    // Set the sessionId when loading an existing session
    if (session.sessionId) {
      sessionStorage.setItem("sessionId", session.sessionId);
    }

    const formattedMessages = session.messages.map((msg, index) => ({
      id: `${session.sessionId}-${index}`,
      type: msg.role === "user" ? "user" : "ai",
      content: msg.message,
      timestamp: new Date(msg.timestamp).toLocaleTimeString(),
    }));

    setMessages(formattedMessages);
    setShowHistory(false);
    setErrorMessage(null); // Clear any previous errors
  };

  const loadChatHistory = async () => {
    const token = sessionStorage.getItem("auth_token");
    if (!token) {
      console.error("Missing auth_token");
      return;
    }

    setLoadingChatHistory(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/chat/all-history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 403) {
          // User is inactive
          setErrorMessage(errorData.error || "Your account has been deactivated. Please contact support.");
          return;
        }
        throw new Error(errorData.error || `Failed to fetch chat history: ${res.status}`);
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
      setErrorMessage(err.message || "Failed to load chat history. Please try again.");
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
    let sessionId = sessionStorage.getItem("sessionId");

    if (!token) {
      console.error("Missing auth token");
      setErrorMessage("You must be logged in to send messages.");
      return;
    }

    // // If no sessionId, create a new session first
    // if (!sessionId) {
    //   try {
    //     const newSessionRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/chat/new-session`, {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer ${token}`,
    //       },
    //     });

    //     const newSessionData = await newSessionRes.json();
        
    //     if (!newSessionRes.ok || !newSessionData.success) {
    //       // Handle inactive user or limit reached
    //       if (newSessionRes.status === 403) {
    //         setErrorMessage(newSessionData.error || "You cannot create a new chat session. Please contact support.");
    //         return;
    //       }
    //       throw new Error(newSessionData.error || "Failed to create new chat session");
    //     }

    //     sessionId = newSessionData.sessionId;
    //     sessionStorage.setItem("sessionId", sessionId);
    //   } catch (err) {
    //     console.error("Failed to create new session:", err);
    //     setErrorMessage(err.message || "Failed to create a new chat session. Please try again.");
    //     return;
    //   }
    // }

    const userMsg = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoadingSendMessage(true);
    setErrorMessage(null);

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

      if (!res.ok || !data.success) {
        // Handle specific error cases
        if (res.status === 403) {
          // User inactive or limit reached
          setErrorMessage(data.error || "You cannot send messages. Please contact support.");
          // Remove the user message since it failed
          setMessages((prev) => prev.filter(msg => msg.id !== userMsg.id));
          return;
        }
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
      // Remove the user message since it failed
      setMessages((prev) => prev.filter(msg => msg.id !== userMsg.id));
      setErrorMessage(err.message || "Something went wrong while answering your question. Please try again.");
    } finally {
      setLoadingSendMessage(false);
    }
  };

  const deleteChatSession = async (sessionId) => {
    const token = sessionStorage.getItem("auth_token");
    if (!token || !sessionId || loadingDeleteChat) return;

    setLoadingDeleteChat(true);
    setErrorMessage(null);
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
        const errorData = await res.json();
        if (res.status === 403) {
          // User is inactive
          setErrorMessage(errorData.error || "You cannot delete chat sessions. Your account may be inactive.");
          return;
        }
        throw new Error(errorData.error || `Delete failed: ${res.status}`);
      }
      
      setChatHistory((prev) =>
        prev.filter((chat) => chat.sessionId !== sessionId)
      );

      // Clear messages if we're deleting the current session
      const currentSessionId = sessionStorage.getItem("sessionId");
      if (currentSessionId === sessionId) {
        setMessages([]);
        sessionStorage.removeItem("sessionId");
      }
    } catch (err) {
      console.error("Failed to delete chat session", err);
      setErrorMessage(err.message || "Failed to delete chat session. Please try again.");
    } finally {
      setLoadingDeleteChat(false);
    }
  };

  const startNewChat = async () => {
    const token = sessionStorage.getItem("auth_token");
    if (!token) {
      console.error("Missing auth token");
      setErrorMessage("You must be logged in to start a new chat.");
      return;
    }

    setLoadingNewChat(true);
    setErrorMessage(null);
    setMessages([]);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/chat/new-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 403) {
          // User inactive or limit reached
          setErrorMessage(data.error || "You cannot create a new chat session. Please contact support.");
          return;
        }
        throw new Error(data.error || "Failed to create new chat session");
      }

      // Store the new session ID
      sessionStorage.setItem("sessionId", data.sessionId);
            if (data.limit_info) {
        const { current_count, limit } = data.limit_info;
        if (limit !== null && limit !== undefined) {
          console.log(`Chat sessions: ${current_count}/${limit}`);
        }
      }
    } catch (err) {
      console.error("Failed to create new chat session:", err);
      setErrorMessage(err.message || "Failed to create a new chat session. Please try again.");
    } finally {
      setLoadingNewChat(false);
    }
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
          loadingNewChat={loadingNewChat}
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
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
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
