import { Upload, Loader2 } from "lucide-react";
import React from "react";

const UploadDocument = ({handleFileUpload , fileInputRef, loadingUpload }) => {
  return (
    <div className="mb-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
        disabled={loadingUpload}
      />
      <button
        onClick={() => !loadingUpload && fileInputRef.current?.click()}
        disabled={loadingUpload}
        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loadingUpload ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Upload Documents
          </>
        )}
      </button>
    </div>
  );
};

export default UploadDocument;