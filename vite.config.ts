import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: env.BACKEND_URL || "http://localhost:5080",
          changeOrigin: true,
          secure: !/^https:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(
            env.BACKEND_URL || "",
          ),
        },
      },
    },
  };
});
