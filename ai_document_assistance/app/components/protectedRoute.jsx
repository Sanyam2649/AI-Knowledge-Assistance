"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/userContext";

export default function ProtectedRoute({
  children,
}) {
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.replace("/signIn");
    }
  }, [token, router]);

  if (!token) {
    return null; 
  }

  return <>{children}</>;
}
