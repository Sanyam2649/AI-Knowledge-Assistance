import React from 'react'
import { Loader2 } from 'lucide-react'

const ChatBox = ({messages=[] , messagesEndRef, loadingSendMessage}) => {
  return (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Hi, I am your personal Knowledge Assistant
                </h2>
                <p className="text-gray-400">
                  Upload your documents and start asking questions. I'll analyze them and provide intelligent insights.
                </p>
              </div>
            </div>
          ) : (
            <>
{messages.map(msg => {
  // Function to convert plain text lists to formatted JSX
  const formatContent = (text) => {
    if (!text) return null;

    // Normalize line breaks
    const lines = text.replace(/\r\n|\r/g, '\n').split('\n');

    return lines.map((line, idx) => {
      // Bullet points
      if (/^\s*[\*\-]\s+/.test(line)) {
        return (
          <p key={idx} className="text-sm leading-relaxed pl-4 relative before:absolute before:left-0 before:top-1 before:w-2 before:h-2 before:bg-gray-400 before:rounded-full">
            {line.replace(/^\s*[\*\-]\s+/, '')}
          </p>
        );
      }

      // Numbered lists
      if (/^\s*\d+\.\s+/.test(line)) {
        return (
          <p key={idx} className="text-sm leading-relaxed pl-6">
            {line.replace(/^\s*\d+\.\s+/, '')}
          </p>
        );
      }

      // Normal text
      return (
        <p key={idx} className="text-sm leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div
      key={msg.id}
      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-2xl ${
          msg.type === 'user'
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl rounded-tr-sm'
            : msg.type === 'system'
            ? 'bg-blue-500/20 border border-blue-500/30 rounded-xl'
            : 'bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm'
        } p-4 shadow-lg relative`}
      >
        {/* Formatted message content */}
        <div className="whitespace-pre-line">{formatContent(msg.content)}</div>
        <p className="text-xs text-gray-400 mt-2">{msg.timestamp}</p>
      </div>
    </div>
  );
})}

              {loadingSendMessage && (
                <div className="flex justify-start">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm p-4 shadow-lg flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span className="text-sm text-gray-400">Thinking...</span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
  )
}

export default ChatBox;
