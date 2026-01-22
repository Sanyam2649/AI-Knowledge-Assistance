"use client";

import React, { createContext, useEffect, useState} from "react";

export const ThemeContext = createContext(null);

export default function ToggleThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return (sessionStorage.getItem("theme")) ?? "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    sessionStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
