import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode !== "production";
  const functionsTarget = isDev
    ? "http://127.0.0.1:54321"
    : "https://rmwfzfkwmmpgqntgqaky.functions.supabase.co";

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/functions/v1": {
          target: functionsTarget,
          changeOrigin: true,
          secure: !isDev,
        },
      },
    },
    plugins: [react()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
  };
});
