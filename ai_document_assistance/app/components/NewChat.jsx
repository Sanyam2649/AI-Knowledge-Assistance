import React from 'react'

const NewChat = ({startNewChat}) => {
  return (
           <button
            onClick={startNewChat}
            className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all"
          >
            + New Chat
          </button>
  )
}

export default NewChat;
