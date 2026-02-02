import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authStore';

const DEFAULT_IDLE_MS = 15 * 60 * 1000; // 15 minutes

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll'] as const;

/**
 * Monitors user activity and logs out after a period of inactivity.
 * Resets the timer on mousemove, keydown, click, or scroll.
 * On timeout: calls authStore.logout() and redirects to /login.
 */
export function useIdleTimer(idleTimeoutMs: number = DEFAULT_IDLE_MS) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    timeoutRef.current = setTimeout(() => {
      logout();
      navigate('/login', { replace: true });
    }, idleTimeoutMs);
  }, [idleTimeoutMs, logout, navigate]);

  useEffect(() => {
    resetTimer();

    const handleActivity = () => resetTimer();

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer]);
}
