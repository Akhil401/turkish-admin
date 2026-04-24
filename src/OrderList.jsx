import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { toast } from 'react-hot-toast';
import { colors, shadows } from './theme';
import { t } from './translations';
import LogoSpinner from './components/LogoSpinner';

// Icons
const Icons = {
    Search: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    Filter: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
    ),
    Package: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    ),
    User: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    ChevronDown: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    ),
    Clock: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Euro: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4" />
        </svg>
    ),
    MapPin: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    X: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    Food: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    Image: () => (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    Upload: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
    ),
    Tag: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Message: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
    ),
};

// Status Dropdown Component
const StatusDropdown = ({ orderId, currentStatus, onUpdate, statusOptions, colors }) => {
    const [localStatus, setLocalStatus] = useState(currentStatus);

    useEffect(() => {
        setLocalStatus(currentStatus);
    }, [currentStatus]);

    const handleChange = (e) => {
        const newStatus = e.target.value;
        setLocalStatus(newStatus);
        onUpdate(orderId, newStatus);
    };

    return (
        <select
            value={localStatus}
            onChange={handleChange}
            className="flex-1 px-3 py-2 rounded-lg text-sm border focus:outline-none cursor-pointer"
            style={{
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
            }}
        >
            {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
};

// Helper function to format address object
const formatAddress = (address) => {
    if (!address) return 'N/A';
    const { address_line1, address_line2, city, state, zip_code, country } = address;
    const parts = [address_line1, address_line2, city, state, zip_code, country].filter(Boolean);
    return parts.join(', ');
};

function OrderList() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const statusOptions = [
        { value: 'placed', label: t('placed'), color: colors.status.placed },
        { value: 'accepted', label: t('accepted'), color: colors.status.accepted },
        { value: 'preparing', label: t('preparing'), color: colors.status.preparing },
        { value: 'ready', label: t('ready'), color: colors.status.ready },
        { value: 'sent', label: t('sent'), color: colors.status.sent },
        { value: 'delivered', label: t('delivered'), color: colors.status.delivered },
        { value: 'rejected', label: t('rejected'), color: colors.status.rejected }
    ];

    const speakOrder = (order) => {
        if ('speechSynthesis' in window) {
            const text = `Nuovo ordine ricevuto di ${order.total} euro!`;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'it-IT';
            utterance.rate = 0.9; // Slightly slower for clarity
            window.speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        fetchOrders();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('orders-channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                console.log('New order received:', payload);
                speakOrder(payload.new);
                fetchOrders();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
                console.log('Order update received:', payload);
                fetchOrders();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        let filtered = orders;

        if (searchTerm) {
            filtered = filtered.filter(order =>
                order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        setFilteredOrders(filtered);
    }, [searchTerm, statusFilter, orders]);


    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, profiles!user_id(full_name, email, phone), driver:profiles!driver_id(full_name, phone)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
            setFilteredOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error(t('loading'));
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        console.log(`Updating order ${id} to status: ${newStatus}`);
        try {
            const { data, error } = await supabase
                .from('orders')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select();

            console.log('Update response:', { data, error });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                console.warn('No rows updated - check RLS policies');
                toast.error(t('noOrdersFound'));
                return;
            }

            toast.success(`${t('orderStatusUpdated')} ${newStatus}`);

            // Update local state
            setOrders(orders.map(order =>
                order.id === id ? { ...order, status: newStatus } : order
            ));

            // Update filtered orders too
            setFilteredOrders(filteredOrders.map(order =>
                order.id === id ? { ...order, status: newStatus } : order
            ));

            // Update selected order if modal is open
            if (selectedOrder?.id === id) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error(error.message);
        }
    };

    const openOrderDetail = async (order) => {
        setSelectedOrder(order);
        setIsDetailOpen(true);

        // Fetch order items
        try {
            const { data, error } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', order.id);

            if (error) throw error;
            setOrderItems(data || []);
        } catch (error) {
            console.error('Error fetching order items:', error);
            toast.error(t('loading'));
        }
    };

    const closeOrderDetail = () => {
        setIsDetailOpen(false);
        setSelectedOrder(null);
        setOrderItems([]);
    };

    const getStatusColor = (status) => {
        const statusColors = {
            placed: colors.status.placed,
            accepted: colors.status.accepted,
            preparing: colors.status.preparing,
            ready: colors.status.ready,
            sent: colors.status.sent,
            delivered: colors.status.delivered,
            rejected: colors.status.rejected
        };
        return statusColors[status] || colors.textMuted;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const activeOrders = filteredOrders.filter(o => !['delivered', 'rejected'].includes(o.status));
    const completedOrders = filteredOrders.filter(o => ['delivered', 'rejected'].includes(o.status));

    const OrderCard = ({ order, isCompleted }) => (
        <div
            onClick={() => openOrderDetail(order)}
            className="rounded-2xl p-5 transition-all duration-200 hover:shadow-lg cursor-pointer"
            style={{ backgroundColor: colors.card, boxShadow: shadows.md }}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${getStatusColor(order.status)}15` }}
                    >
                        <Icons.Package />
                    </div>
                    <div>
                        <p className="font-bold" style={{ color: colors.text }}>
                            #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-sm flex items-center gap-1" style={{ color: colors.textMuted }}>
                            <Icons.Clock />
                            {formatDate(order.created_at)}
                        </p>
                    </div>
                </div>
                <span
                    className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                    style={{
                        backgroundColor: `${getStatusColor(order.status)}20`,
                        color: getStatusColor(order.status)
                    }}
                >
                    {order.status}
                </span>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm" style={{ color: colors.textLight }}>
                    <Icons.User />
                    <span>{order.profiles?.full_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: colors.textLight }}>
                    <Icons.Euro />
                    <span className="font-semibold" style={{ color: colors.primary }}>
                        €{order.total?.toFixed(2)}
                    </span>
                </div>
                {order.address && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: colors.textLight }}>
                        <Icons.MapPin />
                        <span className="truncate" title={formatAddress(order.address)}>
                            {formatAddress(order.address)}
                        </span>
                    </div>
                )}
            </div>

            {!isCompleted && (
                <div className="pt-4 border-t" style={{ borderColor: colors.borderLight }} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: colors.text }}>
                            {t('status')}:
                        </span>
                        <StatusDropdown orderId={order.id} currentStatus={order.status} onUpdate={updateStatus} statusOptions={statusOptions} colors={colors} />
                    </div>
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LogoSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
                        {t('orderManagement')}
                    </h1>
                    <p style={{ color: colors.textMuted }}>
                        {filteredOrders.length} {t('totalOrders')} · {activeOrders.length} {t('activeOrders')}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div
                className="p-4 rounded-2xl flex flex-col md:flex-row gap-4"
                style={{ backgroundColor: colors.card, boxShadow: shadows.md }}
            >
                <div className="flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }}>
                        <Icons.Search />
                    </div>
                    <input
                        type="text"
                        placeholder={t('searchOrders')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none"
                        style={{
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text
                        }}
                        onFocus={(e) => e.target.style.borderColor = colors.primary}
                        onBlur={(e) => e.target.style.borderColor = colors.border}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div style={{ color: colors.textMuted }}>
                        <Icons.Filter />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 rounded-xl border focus:outline-none cursor-pointer"
                        style={{
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text
                        }}
                    >
                        <option value="all">{t('allStatuses')}</option>
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Active Orders */}
            <div>
                <h2 className="text-xl font-bold mb-4" style={{ color: colors.text }}>
                    {t('activeOrders')} ({activeOrders.length})
                </h2>
                {activeOrders.length === 0 ? (
                    <div
                        className="text-center py-12 rounded-2xl"
                        style={{ backgroundColor: colors.card, boxShadow: shadows.md }}
                    >
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.background }}>
                            <Icons.Package />
                        </div>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
                            {t('noActiveOrders')}
                        </h3>
                        <p style={{ color: colors.textMuted }}>
                            {t('allOrdersProcessed')}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeOrders.map(order => (
                            <OrderCard key={order.id} order={order} isCompleted={false} />
                        ))}
                    </div>
                )}
            </div>

            {/* Completed Orders */}
            {completedOrders.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold mb-4" style={{ color: colors.text }}>
                        {t('completedOrders')} ({completedOrders.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {completedOrders.map(order => (
                            <OrderCard key={order.id} order={order} isCompleted={true} />
                        ))}
                    </div>
                </div>
            )}

            {/* Order Detail Modal */}
            {isDetailOpen && selectedOrder && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                    onClick={closeOrderDetail}
                >
                    <div
                        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
                        style={{ backgroundColor: colors.card, boxShadow: shadows.xl }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: colors.borderLight }}>
                            <div>
                                <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
                                    Order #{selectedOrder.id.slice(-8).toUpperCase()}
                                </h2>
                                <p className="text-sm" style={{ color: colors.textMuted }}>
                                    {formatDate(selectedOrder.created_at)}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span
                                    className="px-4 py-2 rounded-full text-sm font-medium capitalize"
                                    style={{
                                        backgroundColor: `${getStatusColor(selectedOrder.status)}20`,
                                        color: getStatusColor(selectedOrder.status)
                                    }}
                                >
                                    {selectedOrder.status}
                                </span>
                                <button
                                    onClick={closeOrderDetail}
                                    className="p-2 rounded-xl transition-colors"
                                    style={{ color: colors.textLight }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = colors.background}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    <Icons.X />
                                </button>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: colors.background }}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold" style={{ color: colors.text }}>
                                    {t('customerInformation')}
                                </h3>
                                <button
                                    onClick={() => navigate(`/chat?userId=${selectedOrder.user_id}`)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                                    style={{
                                        backgroundColor: colors.primary,
                                        color: colors.textInverse,
                                        boxShadow: shadows.md,
                                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`
                                    }}
                                >
                                    <Icons.Message />
                                    {t('messageCustomer') || 'Message Customer'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm" style={{ color: colors.textMuted }}>{t('name')}</p>
                                    <p className="font-medium" style={{ color: colors.text }}>
                                        {selectedOrder.profiles?.full_name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm" style={{ color: colors.textMuted }}>{t('email')}</p>
                                    <p className="font-medium" style={{ color: colors.text }}>
                                        {selectedOrder.profiles?.email || 'N/A'}
                                    </p>
                                </div>
                                {selectedOrder.profiles?.phone && (
                                    <div>
                                        <p className="text-sm" style={{ color: colors.textMuted }}>{t('phone')}</p>
                                        <p className="font-medium" style={{ color: colors.text }}>
                                            {selectedOrder.profiles.phone}
                                        </p>
                                    </div>
                                )}
                                {selectedOrder.address && (
                                    <div className="col-span-2">
                                        <p className="text-sm" style={{ color: colors.textMuted }}>{t('address')}</p>
                                        <p className="font-medium" style={{ color: colors.text }}>
                                            {formatAddress(selectedOrder.address)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: colors.background }}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold" style={{ color: colors.text }}>
                                    Delivery Information
                                </h3>
                            </div>
                            {selectedOrder.driver_id ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm" style={{ color: colors.textMuted }}>Assigned Driver</p>
                                        <p className="font-medium" style={{ color: colors.text }}>
                                            {selectedOrder.driver?.full_name || 'Unknown Driver'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/chat?userId=${selectedOrder.driver_id}`)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                                        style={{
                                            backgroundColor: colors.primary,
                                            color: colors.textInverse,
                                            boxShadow: shadows.md,
                                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`
                                        }}
                                    >
                                        <Icons.Message />
                                        Message Driver
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm" style={{ color: colors.textMuted }}>Assigned Driver</p>
                                    <p className="font-medium" style={{ color: colors.status?.rejected || '#ef4444' }}>
                                        Driver is not yet assigned
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Additional Information */}
                        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: colors.background }}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm" style={{ color: colors.textMuted }}>{t('paymentMethod') || 'Payment Method'}</p>
                                    <p className="font-medium" style={{ color: colors.text }}>
                                        {selectedOrder.payment_method === 'card' ? '💳 Card' : '💵 Cash on Delivery'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm" style={{ color: colors.textMuted }}>{t('deliverySlot') || 'Delivery Slot'}</p>
                                    <p className="font-medium" style={{ color: colors.text }}>
                                        {selectedOrder.delivery_time ? 
                                            new Date(selectedOrder.delivery_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                                            'ASAP'}
                                    </p>
                                </div>
                                {selectedOrder.allergy_comments && (
                                    <div className="col-span-2 mt-2 p-3 rounded-lg border-l-4 border-red-500 bg-red-50">
                                        <p className="text-xs font-bold text-red-600 uppercase mb-1">⚠️ Allergy Comments</p>
                                        <p className="text-sm font-medium text-red-900">
                                            {selectedOrder.allergy_comments}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="mb-6">
                            <h3 className="font-semibold mb-4" style={{ color: colors.text }}>
                                {t('orderItems')} ({orderItems.length})
                            </h3>
                            {orderItems.length === 0 ? (
                                <p style={{ color: colors.textMuted }}>{t('noItemsFound')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {orderItems.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 rounded-xl"
                                            style={{ backgroundColor: colors.background }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                    style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                                                >
                                                    <Icons.Food />
                                                </div>
                                                <div>
                                                    <p className="font-medium" style={{ color: colors.text }}>
                                                        {item.name || item.itemName || t('unknownItem')}
                                                    </p>
                                                    <p className="text-sm" style={{ color: colors.textMuted }}>
                                                        €{(item.price_at_order || item.price || 0).toFixed(2)} each
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold" style={{ color: colors.text }}>
                                                    x{item.quantity || 1}
                                                </p>
                                                <p className="text-sm font-medium" style={{ color: colors.primary }}>
                                                    €{((item.price_at_order || item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Order Total */}
                        <div className="pt-4 border-t" style={{ borderColor: colors.borderLight }}>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold" style={{ color: colors.text }}>
                                    {t('total')}
                                </span>
                                <span className="text-2xl font-bold" style={{ color: colors.primary }}>
                                    €{selectedOrder.total?.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Update Status (for non-completed orders) */}
                        {!['delivered', 'rejected'].includes(selectedOrder.status) && (
                            <div className="mt-6 pt-4 border-t" style={{ borderColor: colors.borderLight }}>
                                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                                    {t('status')}
                                </label>
                                <select
                                    value={selectedOrder.status}
                                    onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border focus:outline-none cursor-pointer"
                                    style={{
                                        backgroundColor: colors.background,
                                        borderColor: colors.border,
                                        color: colors.text
                                    }}
                                >
                                    {statusOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderList;