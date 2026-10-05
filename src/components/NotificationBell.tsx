"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import Link from 'next/link';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    link: string;
    created_at: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (err) {
            console.error('Notifications fetch error:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ all: true }),
            });
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const markRead = async (id: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-accent hover:bg-accent/10 hover:border-accent/20 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-accent/30">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-[#0D0D12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="font-bold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-accent hover:underline">
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map(n => (
                            <div key={n.id} onClick={() => { if (!n.read) markRead(n.id); }} className="relative">
                                {n.link ? (
                                    <Link href={n.link} onClick={() => setOpen(false)} className={`block p-4 hover:bg-white/5 transition-colors border-b border-white/5 ${!n.read ? 'bg-accent/5' : ''}`}>
                                        <div className="flex items-start gap-3">
                                            {!n.read && <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />}
                                            <div className={!n.read ? '' : 'ml-5'}>
                                                <p className="text-sm font-medium">{n.title}</p>
                                                <p className="text-xs text-white/40 mt-1 line-clamp-2">{n.message}</p>
                                                <p className="text-[10px] text-white/20 mt-2 font-mono">{formatTimeAgo(n.created_at)}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className={`p-4 border-b border-white/5 ${!n.read ? 'bg-accent/5' : ''}`}>
                                        <div className="flex items-start gap-3">
                                            {!n.read && <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />}
                                            <div className={!n.read ? '' : 'ml-5'}>
                                                <p className="text-sm font-medium">{n.title}</p>
                                                <p className="text-xs text-white/40 mt-1 line-clamp-2">{n.message}</p>
                                                <p className="text-[10px] text-white/20 mt-2 font-mono">{formatTimeAgo(n.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="p-8 text-center text-white/30 text-sm">
                                No notifications yet.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
