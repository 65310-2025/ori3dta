import React from "react";

import { GoogleOAuthProvider } from "@react-oauth/google";
import ReactDOM from "react-dom/client";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";

import App from "./components/App";
import Editor from "./components/pages/Editor";
import Landing from "./components/pages/Landing";
import Library from "./components/pages/Library";
import Login from "./components/pages/Login";
import NotFound from "./components/pages/NotFound";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<NotFound />} element={<App />}>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/library" element={<Library />} />
      <Route path="/editor/:cpID" element={<Editor />} />
    </Route>,
  ),
);

// renders React Component "Root" into the DOM element with ID "root"
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <RouterProvider router={router} />
  </GoogleOAuthProvider>,
);
