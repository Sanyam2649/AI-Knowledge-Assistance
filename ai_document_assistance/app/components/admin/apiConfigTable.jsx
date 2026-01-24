"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Plus,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ApiConfigModal } from "./apiConfigModal";

export default function ApiConfigTable() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeConfigs, setActiveConfigs] = useState(0);
  const [totalConfigs, setTotalConfigs] = useState(0);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API}/admin/api-config`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (!data.success) throw new Error("API returned success: false");

      setConfigs(data.configs || []);
      setTotalConfigs(data.configs?.length || 0);
      setActiveConfigs(
        data.configs?.filter((config) => config.is_active).length || 0
      );
    } catch (error) {
      console.error("Failed to fetch API configs:", error);
      alert("Failed to load API configurations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleToggleStatus = async (configId, currentStatus) => {
    try {
      setConfigs(
        configs.map((config) =>
          config._id === configId
            ? { ...config, is_active: !currentStatus }
            : config
        )
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API}/admin/api-config/${configId}/toggle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify({ is_active: !currentStatus }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setConfigs(
          configs.map((config) =>
            config._id === configId
              ? { ...config, is_active: currentStatus }
              : config
          )
        );
        alert(data.error || "Failed to toggle config status");
        return;
      }

      setConfigs(
        configs.map((config) =>
          config._id === configId ? { ...config, is_active: data.is_active } : config
        )
      );
      setActiveConfigs(
        configs.filter((c) => c._id !== configId).filter((c) => c.is_active).length +
          (data.is_active ? 1 : 0)
      );
    } catch (err) {
      setConfigs(
        configs.map((config) =>
          config._id === configId
            ? { ...config, is_active: currentStatus }
            : config
        )
      );
      alert("Error toggling config status: " + err.message);
    }
  };

  const handleDelete = async (configId) => {
    if (
      !confirm(
        "Are you sure you want to delete this API configuration? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API}/admin/api-config/${configId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("auth_token")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete configuration");
        return;
      }

      setConfigs(configs.filter((config) => config._id !== configId));
      setTotalConfigs(totalConfigs - 1);
      if (configs.find((c) => c._id === configId)?.is_active) {
        setActiveConfigs(activeConfigs - 1);
      }
      alert(data.message || "Configuration deleted successfully");
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting the configuration");
    }
  };

  const handleEdit = (config) => {
    setSelectedConfig(config);
  };

  const handleCreate = () => {
    setSelectedConfig(null);
    setShowCreateModal(true);
  };

  const handleSave = async (configData) => {
    try {
      const url = configData._id
        ? `${process.env.NEXT_PUBLIC_BACKEND_API}/admin/api-config/${configData._id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_API}/admin/api-config`;

      const method = configData._id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          key_name: configData.key_name,
          key_value: configData.key_value,
          description: configData.description,
          is_active: configData.is_active,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save configuration");
      }

      await fetchConfigs();
      setSelectedConfig(null);
      setShowCreateModal(false);
      alert(
        configData._id
          ? "Configuration updated successfully!"
          : "Configuration created successfully!"
      );
      return { success: true };
    } catch (err) {
      console.error("Error saving configuration:", err);
      return { success: false, error: err.message };
    }
  };

  const filteredConfigs = configs.filter((config) =>
    `${config.key_name} ${config.description || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl hover:shadow-purple-500/20 transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">
                Total Configurations
              </p>
              <h3 className="text-3xl font-bold text-white">{totalConfigs}</h3>
            </div>
            <div className="bg-purple-500/20 p-4 rounded-xl">
              <Key className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 shadow-xl hover:shadow-green-500/20 transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">
                Active Configurations
              </p>
              <h3 className="text-3xl font-bold text-white">{activeConfigs}</h3>
            </div>
            <div className="bg-green-500/20 p-4 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-6 mb-6 border border-gray-700/50">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by key name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30 font-semibold whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Config
            </button>
            <button
              onClick={fetchConfigs}
              className="flex items-center justify-center gap-2 bg-slate-700/50 text-white px-6 py-3 rounded-xl hover:bg-slate-600 transition-all border border-gray-600 font-semibold whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-gray-700">
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Key Name
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-5 text-right text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Loading configurations...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredConfigs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {searchTerm
                        ? "No configurations found matching your search"
                        : "No API configurations found. Click 'Add Config' to create one."}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredConfigs.map((config) => (
                  <tr
                    key={config._id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {config.key_name}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {config.key_value_encrypted ? (
                              <span className="flex items-center gap-1">
                                <Key className="w-3 h-3" />
                                Encrypted
                              </span>
                            ) : (
                              "Plain text"
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() =>
                          handleToggleStatus(config._id, config.is_active)
                        }
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all duration-200 ${
                          config.is_active
                            ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 hover:shadow-md hover:scale-105"
                            : "bg-gradient-to-r from-red-100 to-pink-100 text-red-700 hover:shadow-md hover:scale-105"
                        }`}
                      >
                        {config.is_active ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-gray-300 font-medium">
                        {formatDate(config.updated_at || config.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(config)}
                          className="p-2.5 text-purple-400 hover:bg-purple-500/20 rounded-xl transition-all duration-200 hover:scale-110 border border-transparent hover:border-purple-500/30"
                          title="Edit configuration"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(config._id)}
                          className="p-2.5 text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-200 hover:scale-110 border border-transparent hover:border-red-500/30"
                          title="Delete configuration"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {(selectedConfig || showCreateModal) && (
        <ApiConfigModal
          config={selectedConfig}
          onClose={() => {
            setSelectedConfig(null);
            setShowCreateModal(false);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

