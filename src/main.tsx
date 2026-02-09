import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SplashScreen } from "@capacitor/splash-screen";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Hide splash screen once app is mounted
SplashScreen.hide().catch(() => {
  // Not running in Capacitor, ignore
});
