import React, { useContext } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { UserContext } from "../App";

const Login: React.FC = () => {
  const context = useContext(UserContext);

  if (!context) {
    return null; // or handle the case where context is null
  }

  const { userId, handleLogin, handleLogout } = context;

  return (
    <>
      <h1 className="font-bold nderline">Ori3dita</h1>
      <h2>The collaborative 3D crease pattern editor</h2>
      <GoogleLogin onSuccess={handleLogin} onError={() => console.log("Login failed")} />
    </>
  );
};

export default Login;
