import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ParcnetClientProvider } from "./lib/UseParcnetClient";
import { Zapp } from "@parcnet-js/app-connector";
import { getConnectionInfo } from "./utils.ts";

const zapp: Zapp = {
  name: "Tensions",
  permissions: ["read", "write"],
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ParcnetClientProvider zapp={zapp} connectionInfo={getConnectionInfo()}>
      <App />
    </ParcnetClientProvider>
  </StrictMode>
);
