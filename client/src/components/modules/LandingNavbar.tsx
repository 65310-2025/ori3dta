import React, { useContext, useEffect, useState } from "react";

import { googleLogout } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

import logo from "../../../logo_text.png";
import themeToggle from "../../assets/icons/theme-toggle.svg";
import { UserContext } from "../App";
import "./LandingNavbar.css";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(UserContext);

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    console.log("Theme changed to:", theme);
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    console.log("Theme toggled");
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  if (!context) {
    return null;
  }

  const { userId, userName, handleLogout } = context;

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
    setDropdownVisible(!dropdownVisible);
  };

  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    // close dropdown if click outside
    function close(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownVisible(false);
      }
    }
    if (dropdownVisible) {
      window.addEventListener("click", close);
    }
    return function removeListener() {
      window.removeEventListener("click", close);
    };
  }, [dropdownVisible]);

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
    <button
      className="Navbar-link"
      onClick={() => {
        navigate("/login");
      }}
    >
      Login / Sign Up
    </button>
  );

  return (
    <div className="Navbar">
      <div className="Navbar-items">
        <a
          className="Navbar-link"
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
        <img
          src={themeToggle}
          alt="Theme Toggle"
          className="Navbar-theme-toggle"
          onClick={toggleTheme}
        />
        {loginElement}
      </div>
    </div>
  );
};

export default Navbar;
