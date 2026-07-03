import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { JiraProvider } from "@/context/JiraProvider";
import "@/styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <JiraProvider>
      <App />
    </JiraProvider>
  </React.StrictMode>,
);
