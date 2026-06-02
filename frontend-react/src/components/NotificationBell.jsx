import React, { useState, useEffect, useRef } from 'react';
import { Bell, Trash2, X } from 'lucide-react';
import api from '../api/axios';

const NotificationBell = () => {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const rootRef = useRef(null);

  const load = async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        api.get('/notifications/unread-count'),
        api.get('/notifications'),
      ]);
      setCount(countRes.data.count || 0);
      setNotifications(listRes.data.slice(0, 8));
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    load();
  };

  const clearAll = async () => {
    if (clearing || notifications.length === 0) return;
    setClearing(true);
    try {
      try {
        await api.delete('/notifications');
      } catch {
        await api.post('/notifications/clear');
      }
      setNotifications([]);
      setCount(0);
      setOpen(false);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        type="button"
        className="bell-btn"
        onClick={() => setOpen((current) => !current)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={20} />
        {count > 0 && <span className="bell-badge">{count}</span>}
      </button>
      {open && (
        <div className="notification-panel glass-panel">
          <div className="notification-panel-header">
            <div>
              <h4>Notifications</h4>
              <span>{count > 0 ? `${count} unread` : 'All caught up'}</span>
            </div>
            <div className="notification-actions">
              <button
                type="button"
                className="notification-icon-btn"
                onClick={clearAll}
                disabled={clearing || notifications.length === 0}
                title="Clear notifications"
                aria-label="Clear notifications"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                className="notification-icon-btn"
                onClick={() => setOpen(false)}
                title="Close notifications"
                aria-label="Close notifications"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <p className="empty-text">No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <button
                type="button"
                key={n.id}
                className={`notification-item ${n.read ? 'read' : ''}`}
                onClick={() => !n.read && markRead(n.id)}
              >
                <strong>{n.title}</strong>
                <p>{n.message}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
