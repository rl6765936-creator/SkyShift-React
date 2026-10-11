import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "./api";
import { AuthProvider } from "./auth";
import { App } from "./App";
import "./styles.css";
import "./refinements.css";
import { LanguageProvider } from "./i18n";
const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) =>
        !(
          error instanceof ApiError &&
          [400, 401, 403, 404, 409].includes(error.status)
        ) && count < 1,
    },
    mutations: { retry: false },
  },
});
const root = document.getElementById("root");
if (!root) throw new Error("Application root is missing.");
createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <AuthProvider>
        <BrowserRouter>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
