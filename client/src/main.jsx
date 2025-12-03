import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { WalletProvider } from "./contexts/WalletContext";
import { ToastProvider } from "./components/Toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ToastProvider>
    <WalletProvider>
      <App />
    </WalletProvider>
  </ToastProvider>
);
