import React from 'react'
import UploadDocument from './uploadDocument'
import FilterDocuments from './filterDocuments'
import NewChat from './NewChat'

const Sidebar = ({
    showSidebar,
    handleFileUpload,
    fileInputRef,
    setDocuments,
    documents,
    startNewChat,
    loadingUpload,
    loadingDocuments
}) => {
  return (
          <div
        className={`${showSidebar ? "w-80" : "w-0"} transition-all duration-300 overflow-hidden bg-black/30 backdrop-blur-xl border-r border-purple-500/20`}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Knowledge Assistant
            </h1>
          </div>

          <UploadDocument
            handleFileUpload={handleFileUpload}
            fileInputRef={fileInputRef}
            loadingUpload={loadingUpload}
          />
          <FilterDocuments 
            setDocuments={setDocuments} 
            documents={documents}
            loadingDocuments={loadingDocuments}
          />
          <NewChat startNewChat={startNewChat} />
        </div>
      </div>
  )
}

export default Sidebar
