import React, { useContext, useEffect, useState } from "react";

import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

import logo from "../../../favicon.svg";
import { UserContext } from "../App";
import "./Navbar.css";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(UserContext);

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  if (!context) {
    return null;
  }

  const { userId, userName, handleLogin, handleLogout } = context;

  useEffect(() => {
    if (userId && userName) {
      setDisplayName(userName);
    } else {
      setDisplayName(null);
    }
  }, [userId, userName]);

  const handleLogoutAndNavigate = () => {
    console.log("Logging out...");
    setDisplayName(null);
    setDropdownVisible(false);
    googleLogout();
    handleLogout();
    navigate("/");
  };

  const toggleDropdown = () => {
    console.log(`Setting dropdownVisible to ${!dropdownVisible}`);
    console.log(dropdownVisible.toString());
    setDropdownVisible(!dropdownVisible);
  };

  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    // close dropdown if click outside
    function close(e) {
      if (!dropdownRef.current.contains(e.target)) {
        setDropdownVisible(false);
      }
    }
    if (open) {
      window.addEventListener("click", close);
    }
    return function removeListener() {
      window.removeEventListener("click", close);
    };
  }, [open]);

  const loginElement = displayName ? (
    <div className="Navbar-dropdown">
      <div className="Navbar-link Navbar-dropdown-username-wrap">
        <button onClick={toggleDropdown} className="Navbar-dropdown-username">
          Welcome, {displayName}
        </button>
      </div>
      <div
        className="Navbar-links"
        style={{ display: dropdownVisible ? "flex" : "none" }}
      >
        <button
          onClick={() => {
            navigate("/library");
          }}
          className="Navbar-dropdown-link"
        >
          Library
        </button>
        <button
          onClick={handleLogoutAndNavigate}
          className="Navbar-dropdown-link"
        >
          Logout
        </button>
      </div>
    </div>
  ) : (
    <a
      className="Navbar-link"
      onClick={() => {
        navigate("/login");
      }}
    >
      Login / Sign Up
    </a>
  );

  return (
    <div className="Navbar">
      <div className="Navbar-items">
        <a
          onClick={() => {
            navigate("/");
          }}
        >
          <img src={logo} alt="Logo" className="Navbar-logo" />
        </a>
        <a
          className="Navbar-link"
          onClick={() => {
            navigate("/");
          }}
        >
          Home
        </a>
      </div>
      <div className="Navbar-login" ref={dropdownRef}>
        {loginElement}
      </div>
    </div>
  );
};

export default Navbar;
