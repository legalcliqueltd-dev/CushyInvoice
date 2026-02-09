import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Hide splash screen in Capacitor native app
if ((window as any).Capacitor) {
  const { SplashScreen } = (window as any).Capacitor.Plugins;
  if (SplashScreen) {
    SplashScreen.hide();
  }
}
