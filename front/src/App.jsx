import { BrowserRouter } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { useAuthStore } from "./stores/authStore";
import Router from "./router/router";
import "./App.css";

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check for existing token on app load
    checkAuth().catch((error) => {
      console.error("Error checking auth:", error);
    });
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-500">جارٍ تحميل التطبيق...</p>
          </div>
        </div>
      }>
        <Router />
      </Suspense>
    </BrowserRouter>
  );
}

export default App;