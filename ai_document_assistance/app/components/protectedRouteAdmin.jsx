"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/userContext";

export default function ProtectedRouteAdmin({ children }) {
  const { token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.replace("/signIn");
      return;
    }

    if (user?.role !== "admin") {
      router.replace("/home");
    }
  }, [token, user, router]);

  if (!token || user?.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
