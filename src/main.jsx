import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AcessibilidadeProvider } from "./context/AcessibilidadeContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { StockProvider } from "./context/StockContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import "./styles/tokens.css";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AcessibilidadeProvider>
        <AuthProvider>
          <StockProvider>
            <CartProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </CartProvider>
          </StockProvider>
        </AuthProvider>
      </AcessibilidadeProvider>
    </BrowserRouter>
  </StrictMode>,
);
