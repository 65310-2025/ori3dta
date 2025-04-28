import React, { useContext } from "react";

import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

import { UserContext } from "../App";
import logo from "../../../logo_text.svg";


import Navbar from "../modules/LandingNavbar";
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
    navigate("/library");
  };

  return (
    <div>
      <Navbar />
      <div className="Login-page">
        <div className="Login-box">
          <img src={logo} alt="Ori3dita Logo" className="Login-logo" />
          {/* <h1 className="Login-title">Log in to Ori3dita</h1> */}

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
