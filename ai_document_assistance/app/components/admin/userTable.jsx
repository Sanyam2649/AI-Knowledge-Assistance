"use client";
import React, { useState, useEffect, Activity } from "react";
import {
  Search,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  View,
  Eye,
  Users,
  TrendingUp,
} from "lucide-react";
import { UserDetailsModal } from "./userView";

export default function UserTable({}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API}/admin/users`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("auth_token")}`,
          },
        },
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (!data.success) throw new Error("API returned success: false");

      setUsers(data.users);
      setPagination(data.pagination);
      setTotalUsers(data.users.length);
      setActiveUsers(data.users.filter((user) => user.is_active).length);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, is_active: !currentStatus } : user,
        ),
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API}/admin/users/${userId}/toggle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify({ is_active: !currentStatus }),
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, is_active: currentStatus } : user,
          ),
        );
        alert(data.error || "Failed to toggle user status");
        return;
      }

      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, is_active: data.is_active } : user,
        ),
      );
    } catch (err) {
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, is_active: currentStatus } : user,
        ),
      );
      alert("Error toggling user status: " + err.message);
    }
  };

  const handleEdit = async (userId, updateData) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API}/admin/users/${userId}/chat-limits`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify(updateData),
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        console.error("Failed to update chat limits:", data.error);
        return {
          success: false,
          error: data.error || "Failed to update chat limits",
        };
      }
      return { success: true, user: data };
    } catch (err) {
      console.error("Error updating chat limits:", err);
      return { success: false, error: err.message };
    }
  };

  const handleRefresh = () => {
    setUsers(fetchUsers());
  };

  const handleView = (user) => {
    setSelectedUser(user);
  };

  const handleDelete = async (userId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API}/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify({
            delete_chats: true,
            delete_documents: false,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete user");
        return;
      }
      setUsers(users.filter((user) => user._id !== userId));
      setPagination({ ...pagination, total: pagination.total - 1 });

      alert(data.message || "User deleted successfully");
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting the user");
    }
  };

  // const filteredUsers = users.filter(
  //   (user) =>
  //     user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     user.lastName.toLowerCase().includes(searchTerm.toLowerCase()),
  // );

  const filteredUsers = users.filter((user) =>
    `${user.firstName} ${user.lastName} ${user.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const formatDate = (dateString) => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl hover:shadow-purple-500/20 transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">
                Total Users
              </p>
              <h3 className="text-3xl font-bold text-white">{totalUsers}</h3>
            </div>
            <div className="bg-purple-500/20 p-4 rounded-xl">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 shadow-xl hover:shadow-green-500/20 transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">
                Active Users
              </p>
              <h3 className="text-3xl font-bold text-white">{activeUsers}</h3>
            </div>
            <div className="bg-green-500/20 p-4 rounded-xl">
              <Activity className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-6 mb-6 border border-gray-700/50">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
            />
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30 font-semibold whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
      <div className="rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-gray-700">
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-5 text-right text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-white">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="text-sm text-white font-medium">
                        {user.email}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                        {user.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() =>
                        handleToggleStatus(user._id, user.is_active)
                      }
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all duration-200 ${
                        user.is_active
                          ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 hover:shadow-md hover:scale-105"
                          : "bg-gradient-to-r from-red-100 to-pink-100 text-red-700 hover:shadow-md hover:scale-105"
                      }`}
                    >
                      {user.is_active ? (
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
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-400">
                          {user.total_chat_sessions}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm text-gray-300 font-medium">
                      {formatDate(user.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2.5 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all duration-200 hover:scale-110 border border-transparent hover:border-blue-500/30"
                        title="View user"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2.5 text-purple-400 hover:bg-purple-500/20 rounded-xl transition-all duration-200 hover:scale-110 border border-transparent hover:border-purple-500/30"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="p-2.5 text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-200 hover:scale-110 border border-transparent hover:border-red-500/30"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedUser && (
          <UserDetailsModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onUpdate={(updatedUser) =>
              setUsers(
                users.map((u) =>
                  u._id === updatedUser.userId ? { ...u, ...updatedUser } : u,
                ),
              )
            }
            handleEdit={handleEdit}
          />
        )}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}
