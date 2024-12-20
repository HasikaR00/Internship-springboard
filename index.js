import React from "react";
import ReactDOM from "react-dom/client";  // Note: react-dom/client for React 18+
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// Create a root element for rendering
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render the App component inside the root element
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
