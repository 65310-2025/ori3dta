import React, { useState, useEffect, createContext } from "react";
import { Outlet } from "react-router-dom";
import jwt_decode from "jwt-decode";
import { socket } from "../client-socket";
import { get, post } from "../utilities";
import { AuthContextValue } from "../types/types";
import { UserDto } from "../../../dto/dto";

export const UserContext = createContext<AuthContextValue | null>(null);

/**
 * Define the "App" component
 */
const App: React.FC = () => {
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    get("/api/whoami").then((user: UserDto) => {
      console.log(user);
      if (user._id) { // logged in
        setUserId(user._id);
      }
      else { // not logged in
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
