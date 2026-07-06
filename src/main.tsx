import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "@/App";
import { JiraProvider } from "@/context/JiraProvider";
import { AppBoundary } from "@/components/common/AppBoundary";
import { queryClient } from "@/queryClient";
import "@/styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppBoundary>
        <JiraProvider>
          <App />
        </JiraProvider>
      </AppBoundary>
    </QueryClientProvider>
  </React.StrictMode>,
);
