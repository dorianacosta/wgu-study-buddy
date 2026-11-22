/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
