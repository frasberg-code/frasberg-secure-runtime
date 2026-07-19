import "./App.css";
import { ReactLenis } from "lenis/react";
import { Toaster } from "sonner";
import { ThemeProvider } from "./context/ThemeContext";
import Landing from "./pages/Landing";

function App() {
  return (
    <ThemeProvider>
      <ReactLenis root options={{ lerp: 0.09, smoothWheel: true }}>
        <div className="App grain">
          <Landing />
          <Toaster position="top-center" richColors />
        </div>
      </ReactLenis>
    </ThemeProvider>
  );
}

export default App;
