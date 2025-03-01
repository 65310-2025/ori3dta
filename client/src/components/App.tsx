import React, { createContext, useEffect, useState } from "react";

import jwt_decode from "jwt-decode";
import { Outlet } from "react-router-dom";

import { UserDto } from "../../../dto/dto";
import { socket } from "../client-socket";
import { AuthContextValue } from "../types/types";
import { get, post } from "../utilities";

export const UserContext = createContext<AuthContextValue | null>(null);

/**
 * Define the "App" component
 */
const App: React.FC = () => {
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    get("/api/whoami").then((user: UserDto) => {
      if (user._id) {
        // they are registered in the database, and currently logged in.
        setUserId(user._id);
      }
    });
  }, []);

  const handleLogin = (credentialResponse: any) => {
    const userToken = credentialResponse.credential;
    const decodedCredential = jwt_decode(userToken) as { name: string };
    console.log(`Logged in as ${decodedCredential.name}`);
    post("/api/login", { token: userToken }).then((user: UserDto) => {
      setUserId(user._id);
      post("/api/initsocket", { socketid: socket.id });
    });
  };

  const handleLogout = () => {
    setUserId(undefined);
    post("/api/logout");
  };

  const authContextValue: AuthContextValue = {
    userId,
    handleLogin,
    handleLogout,
  };

  return (
    <UserContext.Provider value={authContextValue}>
      <Outlet />
    </UserContext.Provider>
  );
};

export default App;
