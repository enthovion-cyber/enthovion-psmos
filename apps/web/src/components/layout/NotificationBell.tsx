'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/stores/notification.store';
import { useNotificationRealtime, useUnreadNotifications } from '@/features/notifications/hooks/useNotifications';
import { NotificationDrawer } from '@/features/notifications/components/NotificationDrawer';

export function NotificationBell() {
  // Initialize your custom real-time socket/subscription hook
  useNotificationRealtime();

  const setOpen = useNotificationStore((state) => state.setDrawerOpen);
  const unreadQuery = useUnreadNotifications();
  const [animateShake, setAnimateShake] = useState(false);

  // SAFE UNWRAP: Fallback evaluation paths based on standard integer values or wrapped response envelopes
  const responseData = unreadQuery.data as unknown;
  const count = typeof responseData === 'number'
    ? responseData
    : isCountResponse(responseData)
    ? responseData.count
    : isDataArrayResponse(responseData)
    ? responseData.data.length
    : Array.isArray(responseData)
    ? responseData.length
    : 0;

  // Trigger an active visual ping shake whenever the live payload count shifts upwards
  useEffect(() => {
    if (count > 0) {
      setAnimateShake(true);
      const timer = setTimeout(() => setAnimateShake(false), 600);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative grid h-10 w-10 place-items-center rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] text-[var(--psm-muted)] hover:text-[var(--psm-text)] transition-all duration-200 focus:outline-none hover:bg-[var(--psm-surface-2)] group"
        aria-label={`${count} unread notifications`}
      >
        {/* Animated Bell Shell Core */}
        <Bell 
          size={18} 
          className={`transition-transform duration-200 group-hover:scale-105 ${
            animateShake ? 'animate-[bell-shake_0.5s_ease-in-out]' : ''
          }`} 
        />
        
        {/* Real-time Counter Badge Overlay */}
        {count > 0 ? (
          <>
            {/* Sci-Fi Radar Pulsing Halo Rings */}
            <span className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full bg-danger opacity-75 animate-ping pointer-events-none" />
            
            {/* Exact Counter Layout Node */}
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-black tracking-tighter text-white border-2 border-[var(--psm-surface)] shadow-md transform scale-100 group-hover:scale-110 transition-transform">
              {count > 99 ? '99+' : count}
            </span>
          </>
        ) : null}
      </button>

      {/* Embedded Global State Notification Sheet Panel */}
      <NotificationDrawer />

      {/* Tailwind Specific Keyframe Injector Layer */}
      <style jsx global>{`
        @keyframes bell-shake {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(15deg); }
          30% { transform: rotate(-12deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-6deg); }
          75% { transform: rotate(4deg); }
        }
      `}</style>
    </>
  );
}

function isCountResponse(value: unknown): value is { count: number } {
  return Boolean(value && typeof value === 'object' && 'count' in value && typeof (value as { count?: unknown }).count === 'number');
}

function isDataArrayResponse(value: unknown): value is { data: unknown[] } {
  return Boolean(value && typeof value === 'object' && 'data' in value && Array.isArray((value as { data?: unknown }).data));
}
