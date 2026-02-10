import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Show branded splash overlay
const splash = document.createElement("div");
splash.id = "app-splash";
splash.innerHTML = `
  <div style="position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#1a56db;transition:opacity 0.4s ease">
    <div style="text-align:center">
      <img src="/favicon.png" alt="CushyInvoice" style="width:80px;height:80px;border-radius:20px;margin-bottom:16px" />
      <div style="color:white;font-size:22px;font-weight:800;letter-spacing:-0.5px">CushyInvoice</div>
    </div>
  </div>
`;
document.body.appendChild(splash);

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Fade out splash after app mounts
setTimeout(() => {
  const el = splash.firstElementChild as HTMLElement;
  if (el) el.style.opacity = "0";
  setTimeout(() => splash.remove(), 400);
}, 1500);

// Hide native splash screen in Capacitor
if ((window as any).Capacitor) {
  const { SplashScreen } = (window as any).Capacitor.Plugins;
  if (SplashScreen) {
    SplashScreen.hide();
  }
}
