import { BrowserRouter } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { useAuthStore } from "./stores/authStore";
import Router from "./router/router";
import "./App.css";

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check for existing token on app load
    checkAuth();
    
    // Set theme
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", isDark);
  }, [checkAuth]);
useEffect(() => {
  useAuthStore.getState().checkAuth();
}, []);
  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جارٍ تحميل التطبيق...</p>
          </div>
        </div>
      }>
        <Router />
      </Suspense>
    </BrowserRouter>
  );
}

export default App;