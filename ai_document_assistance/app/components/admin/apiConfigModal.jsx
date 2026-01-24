"use client";
import React, { useState, useEffect } from "react";
import { X, Key, AlertCircle, Eye, EyeOff, Save, Loader2 } from "lucide-react";

export function ApiConfigModal({ config, onClose, onSave }) {
  const [keyName, setKeyName] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showKeyValue, setShowKeyValue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditMode = !!config;

  useEffect(() => {
    if (config) {
      setKeyName(config.key_name || "");
      setKeyValue(""); // Don't show existing encrypted value
      setDescription(config.description || "");
      setIsActive(config.is_active !== false);
    } else {
      // Reset for new config
      setKeyName("");
      setKeyValue("");
      setDescription("");
      setIsActive(true);
    }
    setError("");
  }, [config]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!keyName.trim()) {
      setError("Key name is required");
      setLoading(false);
      return;
    }

    if (!isEditMode && !keyValue.trim()) {
      setError("Key value is required for new configurations");
      setLoading(false);
      return;
    }

    // Validate key name format (should be uppercase with underscores)
    const keyNamePattern = /^[A-Z_][A-Z0-9_]*$/;
    if (!keyNamePattern.test(keyName)) {
      setError(
        "Key name must be uppercase letters, numbers, and underscores only (e.g., PINECONE_API_KEY)"
      );
      setLoading(false);
      return;
    }

    const configData = {
      _id: config?._id,
      key_name: keyName.trim().toUpperCase(),
      key_value: keyValue.trim() || undefined, // Only send if provided
      description: description.trim() || "",
      is_active: isActive,
    };

    try {
      const result = await onSave(configData);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to save configuration");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const commonKeyNames = [
    "PINECONE_API_KEY",
    "PINECONE_INDEX_NAME",
    "PINECONE_CHAT_INDEX_NAME",
    "GEMINI_API_KEY",
    "GEMINI_API_URL",
    "HUGGINGFACE_API_KEY",
    "HF_MODAL",
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700/50 animate-scaleIn max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
              <Key className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {isEditMode ? "Edit API Configuration" : "New API Configuration"}
              </h2>
              <p className="text-gray-400 text-sm">
                {isEditMode
                  ? "Update API key configuration (values are encrypted)"
                  : "Add a new API key configuration"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700/50 rounded-xl transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Key Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Key Name <span className="text-red-400">*</span>
              </label>
              {!isEditMode ? (
                <>
                  <input
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value.toUpperCase())}
                    placeholder="e.g., PINECONE_API_KEY"
                    className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                    required
                    disabled={loading}
                  />
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-2">
                      Common key names:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {commonKeyNames.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setKeyName(name)}
                          className="px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-600 border border-gray-600 rounded-lg text-gray-300 hover:text-white transition-all"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <input
                  type="text"
                  value={keyName}
                  disabled
                  className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-xl text-gray-400 cursor-not-allowed"
                />
              )}
              <p className="text-xs text-gray-500 mt-1">
                Key name cannot be changed after creation
              </p>
            </div>

            {/* Key Value */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Key Value {!isEditMode && <span className="text-red-400">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showKeyValue ? "text" : "password"}
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  placeholder={
                    isEditMode
                      ? "Enter new value to update (leave empty to keep current)"
                      : "Enter API key value"
                  }
                  className="w-full px-4 py-3 pr-12 bg-slate-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                  required={!isEditMode}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowKeyValue(!showKeyValue)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                >
                  {showKeyValue ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isEditMode
                  ? "Values are encrypted automatically. Leave empty to keep the current encrypted value."
                  : "This value will be encrypted before storage"}
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description for this configuration"
                rows={3}
                className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 transition-all resize-none"
                disabled={loading}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-slate-700 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                disabled={loading}
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-300 cursor-pointer"
              >
                Active (Configuration will be used by the system)
              </label>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-300">
                    <strong>Security Note:</strong> All API key values are
                    automatically encrypted using Fernet symmetric encryption
                    before being stored in the database. Only active
                    configurations are used by the system.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditMode ? "Update Configuration" : "Create Configuration"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

