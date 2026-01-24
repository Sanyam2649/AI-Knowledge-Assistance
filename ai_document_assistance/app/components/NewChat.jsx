import React from 'react'
import { Loader2 } from 'lucide-react'

const NewChat = ({startNewChat, loadingNewChat}) => {
  return (
           <button
            onClick={startNewChat}
            disabled={loadingNewChat}
            className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            {loadingNewChat ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>+ New Chat</span>
            )}
          </button>
  )
}

export default NewChat;
