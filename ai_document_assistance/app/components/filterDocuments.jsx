import { FileText, Trash, Loader2} from 'lucide-react'
import React from 'react'

const FilterDocuments = ({ setDocuments, documents, loadingDocuments }) => {
    
    
const handleDelete = async (documentId) => {
  const token = sessionStorage.getItem('auth_token');
  const user = JSON.parse(sessionStorage.getItem('user'));

  if (!token || !user) {
    console.error('Missing auth token or user');
    return;
  }

  try {
    const res = await fetch(
      `http://127.0.0.1:5050/documents/delete/${documentId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Delete failed: ${res.status}`);
    }

    const data = await res.json();

    if (data.success) {
      setDocuments(prev => prev.filter(d => d._id !== documentId));
    }
  } catch (err) {
    console.error(err);
  }
};

  return (
    <div className="flex-1 overflow-y-auto mb-4">
      <h3 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Documents ({documents.length})
      </h3>

      {loadingDocuments ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          <span className="ml-2 text-sm text-gray-400">Loading documents...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No documents uploaded yet</p>
          ) : (
            documents.map(doc => (
          <div
            key={doc._id}
            className="p-3 bg-white/5 rounded-lg border border-purple-500/20 hover:bg-white/10 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {doc.file_name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(doc.created_at).toLocaleString()} • {doc.status}
                </p>
              </div>
              <button
  onClick={() => handleDelete(doc._id)}
  className="text-gray-400 hover:text-red-400 transition-colors"
>
    <Trash className='w-4 h-4'/>
</button>
            </div>
          </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default FilterDocuments
