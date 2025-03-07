import React, { useContext } from "react";

import { UserContext } from "../App";
import Library from "./Library";
import Login from "./Login";

const Landing: React.FC = () => {
  const context = useContext(UserContext);

  if (!context) {
    return null; // or handle the case where context is null
  }

  const { userId, handleLogin, handleLogout } = context;
  return <>{userId ? <Library /> : <Login />}</>;
};

export default Landing;
