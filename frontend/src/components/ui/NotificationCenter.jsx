import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Clock, AlertTriangle, Truck, TrendingUp, CheckCircle, RefreshCw, X } from 'lucide-react';
import { api } from '../../services/api';

export default function NotificationCenter({ role = 'farmer', userId = null }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async (showSpin = false) => {
    if (showSpin) setIsRefreshing(true);
    try {
      const data = await api.getNotifications(userId, role);
      if (data && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      if (showSpin) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // 15s Polling (§7.5)
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [role, userId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.link_url) {
      navigate(notification.link_url);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'grievance':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'market':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'transport':
        return <Truck className="w-4 h-4 text-indigo-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
        title="Notifications (Polling every 15s)"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/80 backdrop-blur-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-heading text-slate-800">Notifications</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize bg-slate-100 text-slate-700 border border-slate-200">
                {role === 'farmer' ? '🌾 Farmer' : (role === 'buyer' ? '🏢 Buyer' : (role === 'admin' ? '🛡️ Admin' : '🚜 FPO'))}
              </span>
              {unreadCount > 0 ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">
                  {unreadCount} new
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                  Up to date
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchNotifications(true)}
                disabled={isRefreshing}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                title="Refresh now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-xs text-primary font-semibold hover:underline ml-1"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                    !n.is_read ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getCategoryIcon(n.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs font-semibold truncate ${!n.is_read ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                      <span>{formatTimestamp(n.created_at)}</span>
                      {!n.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          className="text-primary hover:underline font-medium"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Scoping Choice Documentation */}
          <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-medium">
              ⚡ 15s interval polling & refetch-on-navigation (§7.5)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
