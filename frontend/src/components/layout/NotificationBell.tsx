import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '../../hooks/useNotifications';

export function NotificationBell() {
  const { notifications, unreadCount, isLoading, error, markAllRead, formatRelative } = useNotifications();
  const [open, setOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Pin the menu just below the bell vertically; horizontally it anchors to
  // the viewport's right edge via CSS so it never spills off-screen, even
  // when the bell isn't the right-most item in its header.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) setMenuTop(rect.bottom + 8);
    }
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  async function handleMarkRead() {
    await markAllRead();
    setOpen(false);
  }

  return (
    <div className="notification-bell">
      <button
        ref={buttonRef}
        type="button"
        className="notification-bell__button"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18.5 9.2a6.5 6.5 0 0 0-13 0c0 5.9-2.4 6.8-2.4 8.6h17.8c0-1.8-2.4-2.7-2.4-8.6" />
          <path d="M9.7 20.3a2.6 2.6 0 0 0 4.6 0" />
        </svg>
        {unreadCount > 0 && <span className="notification-bell__badge">{unreadCount}</span>}
      </button>

      {open &&
        createPortal(
          <section
            ref={menuRef}
            className="notification-menu"
            aria-label="Notifications"
            style={{ top: menuTop }}
          >
            <header className="notification-menu__header">
              <h2>Notifications</h2>
              {unreadCount > 0 && (
                <button type="button" onClick={handleMarkRead}>
                  Mark read
                </button>
              )}
            </header>

            {error ? (
              <p className="notification-menu__empty" role="alert">{error}</p>
            ) : isLoading ? (
              <p className="notification-menu__empty">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="notification-menu__empty">No new notifications.</p>
            ) : (
              <ul className="notification-menu__list">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <strong>{notification.content}</strong>
                    <span>{formatRelative(notification.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>,
          document.body,
        )}
    </div>
  );
}
