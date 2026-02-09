import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Hide splash screen once app is mounted (only in Capacitor)
import("@capacitor/splash-screen")
  .then(({ SplashScreen }) => SplashScreen.hide())
  .catch(() => {
    // Not running in Capacitor or module not available
  });
