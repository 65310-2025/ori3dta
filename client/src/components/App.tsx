import React, { createContext, useEffect, useState } from "react";

import jwt_decode from "jwt-decode";
import { Outlet } from "react-router-dom";

import { UserDto } from "../../../dto/dto";
import { socket } from "../client-socket";
import { AuthContextValue } from "../types/types";
import { get, post } from "../utils/requests";

export const UserContext = createContext<AuthContextValue | null>(null);

const App: React.FC = () => {
  const [userId, setUserId] = useState<string | undefined | null>(undefined);
  const [userName, setUserName] = useState<string | undefined>(undefined);

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

  return (
    <UserContext.Provider value={authContextValue}>
      <Outlet />
    </UserContext.Provider>
  );
};

export default App;
