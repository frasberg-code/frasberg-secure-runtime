import "./App.css";
import { ReactLenis } from "lenis/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "./context/ThemeContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <ThemeProvider>
      <ReactLenis root options={{ lerp: 0.09, smoothWheel: true }}>
        <div className="App grain">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-center" richColors />
        </div>
      </ReactLenis>
    </ThemeProvider>
  );
}

export default App;
