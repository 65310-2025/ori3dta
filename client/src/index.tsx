import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import Landing from "./components/pages/Landing";
import Editor from "./components/pages/Editor";
import NotFound from "./components/pages/NotFound";

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider
} from 'react-router-dom';

import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = "1077700528117-f59tr015sdectfbjnd9b6hqguqfmb5bi.apps.googleusercontent.com";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<NotFound />} element={<App />}>
      <Route path="/" element={<Landing />} />
      <Route path="/editor/:cpID" element={<Editor />} />
    </Route>
  )
);

// renders React Component "Root" into the DOM element with ID "root"
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <RouterProvider router={router} />
  </GoogleOAuthProvider>
);
