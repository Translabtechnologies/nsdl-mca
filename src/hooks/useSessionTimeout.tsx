import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const SESSION_TIMEOUT_MINUTES = Number(
  import.meta.env.VITE_SESSION_TIMEOUT_MINUTES
);
const WARNING_SECONDS = Number(import.meta.env.VITE_SESSION_WARNING_SECONDS);

const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;
const WARNING_BEFORE_MS = WARNING_SECONDS * 1000;

export const useSessionTimeout = () => {
  const { isAuthenticated, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const logoutTimerRef = useRef<number>();
  const warningTimerRef = useRef<number>();

  const clearTimers = () => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
  };

  const resetTimers = () => {
    if (!isAuthenticated) return;
    clearTimers();

    if (WARNING_BEFORE_MS < SESSION_TIMEOUT_MS) {
      warningTimerRef.current = window.setTimeout(() => {
        setShowWarning(true);
      }, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS);
    }

    logoutTimerRef.current = window.setTimeout(() => {
      setShowWarning(false);
      logout();
    }, SESSION_TIMEOUT_MS);
  };

  const extendSession = () => {
    setShowWarning(false);
    resetTimers();
    // Optionally refresh token here
  };

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      setShowWarning(false);
      return;
    }

    const updateActivity = () => {
      localStorage.setItem("session_last_activity", Date.now().toString());
      resetTimers();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "session_last_activity") {
        resetTimers();
      }
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, updateActivity));
    window.addEventListener("storage", handleStorage);

    updateActivity();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, updateActivity));
      window.removeEventListener("storage", handleStorage);
      clearTimers();
    };
  }, [isAuthenticated, logout]);

  return { showWarning, extendSession };
};
