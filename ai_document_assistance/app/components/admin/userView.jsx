import { TrendingUp, Users, X , Mail , Phone , Activity, CheckCircle2, AlertCircle, Calendar, Clock} from "lucide-react";
import { useState } from "react";

const DetailRow = ({ label, value, icon: Icon }) => (
  <div className="flex justify-between items-center py-4 border-b border-gray-700/30 hover:bg-slate-700/20 transition-colors px-4 -mx-4">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-gray-500" />}
      <span className="text-gray-400 text-sm">{label}</span>
    </div>
    <span className="text-white font-medium">{value ?? "—"}</span>
  </div>
);

export function UserDetailsModal({ user, onClose, onUpdate, handleEdit }) {
  const [chatLimit, setChatLimit] = useState(user.chat_limit ?? "");
  const [usageWindow, setUsageWindow] = useState(user.usage_time_window ?? "");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (usageWindow === "custom" && (!usageStart || !usageEnd)) {
      alert("Please provide both Usage Start Time and Usage End Time for custom usage window.");
      setLoading(false);
      return;
    }

    const updateData = {
      chat_limit: chatLimit !== "" ? parseInt(chatLimit, 10) : null,
      usage_time_window: usageWindow || null,
    };

    try {
      const result = await handleEdit(user._id, updateData);
      if (result.success) {
        onUpdate(result.user);
        alert("User chat limits updated successfully!");
        onClose();
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error updating user chat limits");
    } finally {
      setLoading(false);
    }
  };

return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700/50 animate-scaleIn max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-400 text-sm">User Details & Settings</p>
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
          {/* User Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              User Information
            </h3>
            <div className="bg-slate-700/30 rounded-xl p-4">
              <DetailRow label="Email" value={user.email} icon={Mail} />
              <DetailRow label="Phone" value={user.phone} icon={Phone} />
              <DetailRow label="Total Sessions" value={user.total_chat_sessions} icon={Activity} />
              <DetailRow 
                label="Status" 
                value={user.is_active ? 'Active' : 'Inactive'} 
                icon={user.is_active ? CheckCircle2 : AlertCircle}
              />
              <DetailRow 
                label="Created" 
                value={new Date(user.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} 
                icon={Calendar}
              />
            </div>
          </div>

          {/* Chat Limits Settings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Chat Limits & Usage
            </h3>
            
            <div className="space-y-4 bg-slate-700/30 rounded-xl p-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Chat Limit
                </label>
                <input
                  type="number"
                  value={chatLimit}
                  onChange={(e) => setChatLimit(e.target.value)}
                  placeholder="No limit"
                  className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited chats</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Usage Time Window
                </label>
                <select
                  value={usageWindow}
                  onChange={(e) => setUsageWindow(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white transition-all"
                >
                  <option value="">No window</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Period for chat limit reset</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
