import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import api from '../api/axios';

const NotificationBell = () => {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

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

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    load();
  };

  return (
    <div className="notification-bell">
      <button type="button" className="bell-btn" onClick={() => setOpen(!open)}>
        <Bell size={20} />
        {count > 0 && <span className="bell-badge">{count}</span>}
      </button>
      {open && (
        <div className="notification-panel glass-panel">
          <h4>Notifications</h4>
          {notifications.length === 0 ? (
            <p className="empty-text">No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notification-item ${n.read ? 'read' : ''}`}
                onClick={() => !n.read && markRead(n.id)}
              >
                <strong>{n.title}</strong>
                <p>{n.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
