"use client";

import React, { useState } from "react";
import ProtectedRouteAdmin from "../components/protectedRouteAdmin";
import UserCard from "../components/admin/userCard";
import ConfigCard from "../components/admin/ConfigCard";
import {LogOut } from "lucide-react";
import { useAuth } from "../context/userContext";


const Page = () => {
  const [activeCard, setActiveCard] = useState(null);
  const { logout } = useAuth();

  const toggleCard = (cardName) => {
    setActiveCard(activeCard === cardName ? null : cardName);
  };

  return (
    <ProtectedRouteAdmin>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        {/* Header */}
        <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Admin Dashboard
                </h1>
                <p className="text-slate-400 text-sm">
                  Manage your application settings and users
                </p>
              </div>

                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg
                             bg-red-500/10 text-red-400
                             border border-red-500/20
                             hover:bg-red-500/20 hover:text-red-300
                             transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">
              Management
            </h2>

            <div className="space-y-4">
              {activeCard !== "config" && (
                <UserCard
                  showUsersTable={activeCard === "users"}
                  setShowUsersTable={() => toggleCard("users")}
                />
              )}

              {activeCard !== "users" && (
                <ConfigCard
                  showConfigTable={activeCard === "config"}
                  setShowConfigTable={() => toggleCard("config")}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRouteAdmin>
  );
};

export default Page;
