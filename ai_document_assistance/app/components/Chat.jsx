import { History, Lock, Menu, MessageSquare, X, AlertCircle } from "lucide-react";
import React from "react";
import ChatBox from "./ChatBox";
import SendMessage from "./sendMessage";

const Chat = ({
  setShowSidebar,
  showSidebar,
  setShowHistory,
  showHistory,
  messages,
  messagesEndRef,
  setInputMessage,
  handleSendMessage,
  inputMessage,
  logout,
  loadingSendMessage,
  errorMessage,
  setErrorMessage
}) => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="h-16 bg-black/30 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <span className="font-semibold">AI Knowledge Assistant</span>
          </div>
        </div>
        <div className="flex flex-row gap-2">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <Lock className="w-4 h-4" />
            <span className="text-sm">Log Out</span>
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <History className="w-4 h-4" />
            <span className="text-sm">History</span>
          </button>
        </div>
      </div>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="mx-6 mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-300">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <ChatBox messages={messages} messagesEndRef={messagesEndRef} loadingSendMessage={loadingSendMessage} />
      <SendMessage
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        inputMessage={inputMessage}
        loadingSendMessage={loadingSendMessage}
      />
    </div>
  );
};

export default Chat;
