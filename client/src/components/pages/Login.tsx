import React, { useContext } from "react";

import { GoogleLogin } from "@react-oauth/google";

import { UserContext } from "../App";

const Login: React.FC = () => {
  const context = useContext(UserContext);

  if (!context) {
    return null; // or handle the case where context is null
  }

  const { userId, handleLogin, handleLogout } = context;

  return (
    <div className="bg-gray-800 text-white min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl mb-4">Ori3dita</h1>
        <h2 className="text-xl mb-8">
          The collaborative 3D crease pattern editor
        </h2>
        <GoogleLogin
          onSuccess={handleLogin}
          onError={() => console.log("Login failed")}
        />
      </div>
    </div>
  );
};

export default Login;
