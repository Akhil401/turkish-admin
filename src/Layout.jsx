import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { colors, shadows } from './theme';
import { toast } from 'react-hot-toast';
import { t } from './translations';
import { playNotificationSound, initAudio } from './utils/notifications';

// Icons as SVG components
const Icons = {
    Dashboard: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    ),
    Menu: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    ),
    Orders: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
    ),
    Users: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    Chat: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    ),
    Logout: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
    ),
    Bell: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    ),
    MenuBars: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    ),
    X: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    )
};

function Layout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Load notifications from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('admin_notifications');
        if (saved) {
            try {
                setNotifications(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse notifications', e);
            }
        }
    }, []);

    // Save notifications to localStorage when they change
    useEffect(() => {
        localStorage.setItem('admin_notifications', JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                // Fetch profile data (including avatar_url)
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                if (profileData) setProfile(profileData);
            }
        };
        getUser();

        // Update time every minute
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Global Notifications Setup
    useEffect(() => {
        if (!user) return;

        // 1. Listen for New Orders
        const ordersChannel = supabase
            .channel('global-orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                console.log('Realtime Order Event:', payload);
                playNotificationSound();

                const newNotif = {
                    id: `order-${payload.new.id}-${Date.now()}`,
                    type: 'order',
                    title: 'New Order Received',
                    message: `Order #${payload.new.id.slice(-6).toUpperCase()} has been placed.`,
                    timestamp: new Date().toISOString(),
                    read: false,
                    path: '/orders'
                };
                setNotifications(prev => [newNotif, ...prev].slice(0, 20));

                toast.success(t('orderStatusUpdated') || 'New Order Received!', {
                    duration: 6000,
                    icon: '🍕',
                    id: `order-${payload.new.id}`,
                    action: {
                        label: 'View',
                        onClick: () => navigate('/orders')
                    }
                });
            })
            .subscribe();

        // 2. Listen for New Messages
        const messagesChannel = supabase
            .channel('global-messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                console.log('Realtime Message Event:', payload);
                // Only notify if the message is for the admin
                if (payload.new.receiver_id === user.id) {
                    console.log('Incoming Message for this Admin:', payload.new);
                    playNotificationSound();

                    const newNotif = {
                        id: `msg-${payload.new.id}-${Date.now()}`,
                        type: 'message',
                        title: 'New Message',
                        message: payload.new.content || 'You have a new message.',
                        timestamp: new Date().toISOString(),
                        read: false,
                        path: `/chat?userId=${payload.new.sender_id}`
                    };
                    setNotifications(prev => [newNotif, ...prev].slice(0, 20));

                    toast('New message received!', {
                        duration: 5000,
                        icon: '💬',
                        id: `msg-${payload.new.id}`,
                        action: {
                            label: 'View',
                            onClick: () => navigate(`/chat?userId=${payload.new.sender_id}`)
                        }
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(messagesChannel);
        };
    }, [user, navigate]);

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
        setShowNotifications(false);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.success(t('logout'));
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: t('dashboard'), icon: Icons.Dashboard },
        { path: '/menu', label: t('menu'), icon: Icons.Menu },
        { path: '/orders', label: t('orders'), icon: Icons.Orders },
        { path: '/users', label: t('customers'), icon: Icons.Users },
        { path: '/chat', label: 'Chat', icon: Icons.Chat },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className={`flex ${isActive('/chat') ? 'h-screen overflow-hidden' : 'min-h-screen'}`} style={{ backgroundColor: colors.background }}>
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed h-full flex flex-col z-50 transition-transform duration-300 ease-in-out
                    w-64 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{
                    backgroundColor: colors.card,
                    boxShadow: shadows.lg
                }}
            >
                {/* Mobile Close Button */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden absolute top-4 right-4 p-2 rounded-lg"
                    style={{ color: colors.text }}
                >
                    <Icons.X />
                </button>
                {/* Logo Header */}
                <div
                    className="p-6 border-b"
                    style={{ borderColor: colors.borderLight }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                            style={{
                                backgroundColor: 'transparent',
                            }}
                        >
                            <img
                                src="https://i.imgur.com/SXiYUHr.png"
                                alt="Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <h1
                                className="font-bold text-lg leading-tight"
                                style={{ color: colors.text }}
                            >
                                Turkish Kelleci
                            </h1>
                            <p
                                className="text-xs"
                                style={{ color: colors.textMuted }}
                            >
                                {t('adminPortal')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                                style={{
                                    backgroundColor: active ? colors.primary : 'transparent',
                                    color: active ? colors.textInverse : colors.text,
                                }}
                                onMouseEnter={(e) => {
                                    if (!active) {
                                        e.target.style.backgroundColor = colors.background;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!active) {
                                        e.target.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <Icon />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div
                    className="p-4 border-t"
                    style={{ borderColor: colors.borderLight }}
                >
                    <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-2"
                        style={{ backgroundColor: colors.background }}
                    >
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold overflow-hidden"
                            style={{
                                backgroundColor: colors.primaryLight,
                                color: colors.textInverse
                            }}
                        >
                            {profile?.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt="Admin Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                (profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'A')
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p
                                className="text-sm font-medium truncate"
                                style={{ color: colors.text }}
                            >
                                {t('adminUser')}
                            </p>
                            <p
                                className="text-xs truncate"
                                style={{ color: colors.textMuted }}
                            >
                                {user?.email || 'admin@turkishkelleci.com'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200"
                        style={{ color: colors.danger }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = `${colors.danger}15`;
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }}
                    >
                        <Icons.Logout />
                        <span className="font-medium">{t('logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 lg:ml-64 flex flex-col items-stretch ${isActive('/chat') ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
                {/* Top Header */}
                <header
                    className="sticky top-0 z-10 px-4 lg:px-8 py-4 flex items-center justify-between"
                    style={{
                        backgroundColor: colors.card,
                        boxShadow: shadows.sm
                    }}
                >
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-xl"
                            style={{ color: colors.text }}
                        >
                            <Icons.MenuBars />
                        </button>
                        <p style={{ color: colors.textMuted }} className="text-sm hidden sm:block">
                            {currentTime.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <div className="flex items-center gap-4 relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 rounded-xl transition-colors relative"
                            style={{
                                color: showNotifications ? colors.primary : colors.textLight,
                                backgroundColor: showNotifications ? `${colors.primary}10` : 'transparent'
                            }}
                            onMouseEnter={(e) => {
                                if (!showNotifications) e.target.style.backgroundColor = colors.background;
                            }}
                            onMouseLeave={(e) => {
                                if (!showNotifications) e.target.style.backgroundColor = 'transparent';
                            }}
                        >
                            <Icons.Bell />
                            {unreadCount > 0 && (
                                <span
                                    className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold border-2"
                                    style={{
                                        backgroundColor: colors.danger,
                                        color: 'white',
                                        borderColor: colors.card
                                    }}
                                >
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowNotifications(false)}
                                />
                                <div
                                    className="absolute top-full right-0 mt-2 w-80 max-h-[480px] overflow-hidden flex flex-col z-20 rounded-2xl"
                                    style={{
                                        backgroundColor: colors.card,
                                        boxShadow: shadows.xl,
                                        border: `1px solid ${colors.borderLight}`
                                    }}
                                >
                                    {/* Header */}
                                    <div className="p-4 border-b flex flex-col gap-3" style={{ borderColor: colors.borderLight }}>
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold" style={{ color: colors.text }}>Notifications</h3>
                                            {notifications.length > 0 && (
                                                <button
                                                    onClick={markAllAsRead}
                                                    className="text-xs font-medium hover:underline"
                                                    style={{ color: colors.primary }}
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>

                                        {/* Big Enable Sound Button */}
                                        <button
                                            onClick={async () => {
                                                const ok = await initAudio();
                                                if (ok) playNotificationSound(true);
                                                else toast.error("Could not wake audio engine");
                                            }}
                                            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                                            style={{
                                                backgroundColor: `${colors.primary}15`,
                                                color: colors.primary,
                                                border: `2px dashed ${colors.primary}40`
                                            }}
                                        >
                                            <span className="text-xl">🔊</span>
                                            Enable Audio Notifications
                                        </button>
                                    </div>

                                    {/* List */}
                                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <p className="text-sm" style={{ color: colors.textMuted }}>No notifications yet</p>
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => {
                                                        markAsRead(notif.id);
                                                        setShowNotifications(false);
                                                        navigate(notif.path);
                                                    }}
                                                    className="p-4 border-b last:border-0 cursor-pointer transition-colors"
                                                    style={{
                                                        borderColor: colors.borderLight,
                                                        backgroundColor: notif.read ? 'transparent' : `${colors.primary}05`
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.backgroundColor = colors.background}
                                                >
                                                    <div className="flex gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                                            style={{ backgroundColor: notif.type === 'order' ? `${colors.success}15` : `${colors.info}15` }}
                                                        >
                                                            {notif.type === 'order' ? <span className="text-lg">🍕</span> : <span className="text-lg">💬</span>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                                <p className={`text-sm truncate ${notif.read ? 'font-medium' : 'font-bold'}`} style={{ color: colors.text }}>
                                                                    {notif.title}
                                                                </p>
                                                                {!notif.read && (
                                                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors.primary }} />
                                                                )}
                                                            </div>
                                                            <p className="text-xs line-clamp-2 mb-1" style={{ color: colors.textMuted }}>
                                                                {notif.message}
                                                            </p>
                                                            <p className="text-[10px]" style={{ color: colors.textLight }}>
                                                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Footer */}
                                    {notifications.length > 0 && (
                                        <div className="p-3 border-t text-center" style={{ borderColor: colors.borderLight }}>
                                            <button
                                                onClick={clearAll}
                                                className="text-xs font-medium"
                                                style={{ color: colors.textMuted }}
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <div className={`flex-1 ${isActive('/chat') ? 'p-0 overflow-hidden' : 'p-2 sm:p-4 lg:p-8'}`}>
                    {children}
                </div>
            </main>
        </div>
    );
}

export default Layout;