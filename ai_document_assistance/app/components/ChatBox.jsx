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
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl ${
                    msg.type === 'user' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl rounded-tr-sm' 
                      : msg.type === 'system'
                      ? 'bg-blue-500/20 border border-blue-500/30 rounded-xl'
                      : 'bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm'
                  } p-4 shadow-lg`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
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
