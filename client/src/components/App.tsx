import React, { createContext, useEffect, useState } from "react";

import jwt_decode from "jwt-decode";
import { Outlet } from "react-router-dom";

import { UserDto } from "../../../dto/dto";
import { socket } from "../client-socket";
import { AuthContextValue, ThemeContextValue } from "../types/types";
import { get, post } from "../utils/requests";

export const UserContext = createContext<AuthContextValue | null>(null);
export const ThemeContext = createContext<ThemeContextValue | null>(null);

const App: React.FC = () => {
  const [userId, setUserId] = useState<string | undefined | null>(undefined);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    get("/api/whoami").then((user: UserDto) => {
      if (user._id) {
        // logged in
        setUserId(user._id);
        setUserName(user.name);
      } else {
        // not logged in
        setUserId(null);
      }
    });
  }, []);

  const handleLogin = (credentialResponse: any) => {
    const userToken = credentialResponse.credential;
    const decodedCredential = jwt_decode(userToken) as { name: string };
    console.log(`Logged in as ${decodedCredential.name}`);
    post("/api/login", { token: userToken }).then((user: UserDto) => {
      setUserId(user._id);
      setUserName(user.name);
      post("/api/initsocket", { socketid: socket.id });
    });
  };

  const handleLogout = () => {
    setUserId(null);
    setUserName(undefined);
    post("/api/logout");
  };

  const authContextValue: AuthContextValue = {
    userId,
    userName,
    handleLogin,
    handleLogout,
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    console.log("Saved theme:", savedTheme);
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      console.log("Theme set to:", savedTheme);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  const themeContextValue: ThemeContextValue = {
    theme,
    setTheme: (theme: string) => {
      setTheme(theme);
      localStorage.setItem("theme", theme);
      document.documentElement.setAttribute("data-theme", theme);
    },
  };

  return (
    <UserContext.Provider value={authContextValue}>
      <ThemeContext.Provider value={themeContextValue}>
        <Outlet />
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
};

export default App;
