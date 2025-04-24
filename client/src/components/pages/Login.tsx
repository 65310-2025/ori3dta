import React, { useContext } from "react";

import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

import { UserContext } from "../App";
import Navbar from "../modules/Navbar";
import "./Login.css";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(UserContext);

  if (!context) {
    return null; // or handle the case where context is null
  }

  const { handleLogin } = context;

  const handleLoginAndNavigate = (credentialResponse: any) => {
    handleLogin(credentialResponse);
    navigate("/");
  };

  return (
    <div>
      <Navbar />
      <div className="Login-page">
        <div className="Login-box">
          <h1 className="Login-title">Log in to Ori3dita</h1>
          <GoogleLogin
            onSuccess={handleLoginAndNavigate}
            onError={() => console.log("Login failed")}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
