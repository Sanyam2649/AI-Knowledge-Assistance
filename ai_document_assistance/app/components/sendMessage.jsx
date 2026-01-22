import { Send, Loader2 } from 'lucide-react'
import React from 'react'

const SendMessage = ({setInputMessage, handleSendMessage, inputMessage, loadingSendMessage }) => {
  return (
            <div className="p-6 bg-black/30 backdrop-blur-xl border-t border-purple-500/20">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loadingSendMessage && handleSendMessage()}
              placeholder="Ask anything about your documents..."
              disabled={loadingSendMessage}
              className="flex-1 px-6 py-4 bg-white/10 border border-purple-500/30 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loadingSendMessage}
              className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50 disabled:transform-none"
            >
              {loadingSendMessage ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
  )
}

export default SendMessage
