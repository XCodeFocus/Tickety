import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { WalletProvider } from "./contexts/WalletContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <WalletProvider>
    <App />
  </WalletProvider>
);
