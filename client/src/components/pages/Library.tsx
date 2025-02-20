import React, { useContext } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { UserContext } from "../App";

const Library: React.FC = () => {
  const context = useContext(UserContext);

  if (!context) {
    return null; // or handle the case where context is null
  }

  const { userId, handleLogin, handleLogout } = context;
  // TODO: fix this so that they're redirected if not logged in
  return (
    <>
      {userId ? (
        <button
          onClick={() => {
            googleLogout();
            handleLogout();
          }}
        >
          Logout
        </button>
      ) : (
        <GoogleLogin onSuccess={handleLogin} onError={() => console.log("Login failed")} />
      )}
      <h1>Library goes here!</h1>
    </>
  );
};

export default Library;
