import { Trash, X, Loader2 } from "lucide-react";
import React from "react";

const ChatHistory = ({ setShowHistory, loadSessionMessages, chatHistory , deleteChatSession, loadingChatHistory, loadingDeleteChat}) => {
  console.log(chatHistory, "chat History");
  return (
    <div className="w-80 bg-black/30 backdrop-blur-xl border-l border-purple-500/20 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Chat History</h2>
        <button
          onClick={() => setShowHistory(false)}
          className="p-1 hover:bg-white/10 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {loadingChatHistory ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            <span className="ml-2 text-sm text-gray-400">Loading history...</span>
          </div>
        ) : Array.isArray(chatHistory) && chatHistory.length > 0 ? (
          chatHistory.map((chat) => {
            const firstMessage = chat.messages?.[0]?.message || "No messages";
            const lastMessageTimestamp =
              chat.messages?.[chat.messages.length - 1]?.timestamp;
            const isDeleting = loadingDeleteChat;

            return (
              <button
                key={chat.sessionId}
                onClick={() => !isDeleting && loadSessionMessages(chat)}
                disabled={isDeleting}
                className="relative w-full p-4 bg-white/5 hover:bg-white/10 rounded-lg text-left border border-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="font-medium text-sm truncate">{firstMessage}</p>
                {lastMessageTimestamp && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last: {new Date(lastMessageTimestamp).toLocaleString()}
                  </p>
                )}

                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDeleting) {
                      deleteChatSession(chat.sessionId);
                    }
                  }}
                  className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-500 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash className="w-4 h-4"/>
                  )}
                </span>
              </button>
            );
          })
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">
            No chat history yet
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
