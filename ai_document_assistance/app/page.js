"use client";
import React, { useState, useEffect } from "react";
import {
  Brain,
  Sparkles,
} from "lucide-react";
import { useAuth } from "./context/userContext";
import { useRouter } from "next/navigation";

export default function AIKnowledgeLanding() {
  const {token} = useAuth();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  
    useEffect(() => {
      if (token) {
        router.replace("/home");
      }
    }, [token, router]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSignIn = () => {
    window.location.href = "/signIn";
  };

  const handleSignUp = () => {
    window.location.href = "/signup";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Brain className="w-8 h-8 text-purple-400" />
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            KnowledgeAI
          </span>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleSignIn}
            className="px-6 py-2 rounded-full border border-purple-400 text-purple-300 hover:bg-purple-400/10 transition-all duration-300 hover:scale-105"
          >
            Sign In
          </button>
          <button
            onClick={handleSignUp}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/50"
          >
            Sign Up
          </button>
        </div>
      </nav>

      <section className="relative z-10 px-8 py-20 max-w-7xl mx-auto">
        <div
          className={`text-center transform transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-400/30 mb-8">
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span className="text-sm text-purple-200">
              Powered by Advanced AI Technology
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Your Personal
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
              AI Knowledge Assistant
            </span>
          </h1>

          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Unlock the power of artificial intelligence to learn faster,
            understand deeper, and achieve more. Get instant answers,
            personalized insights, and expert-level guidance on any topic.
          </p>

          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
            <button
              onClick={handleSignUp}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 shadow-2xl shadow-purple-500/50 text-lg font-semibold"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 px-8 py-12 border-t border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Brain className="w-6 h-6 text-purple-400" />
            <span className="text-xl font-bold">KnowledgeAI</span>
          </div>
          <div className="text-gray-400 text-sm">
            © 2026 KnowledgeAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
