import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { colors, shadows } from './theme';
import { toast } from 'react-hot-toast';
import { t } from './translations';
import LogoSpinner from './components/LogoSpinner';

// Icons
const Icons = {
  Orders: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  Revenue: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  TrendUp: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

function Dashboard() {
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    menuItems: 0,
    ordersByStatus: {}
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch active orders
        const { data: activeOrders } = await supabase
          .from('orders')
          .select('*')
          .not('status', 'in', '("delivered","rejected")');

        // Fetch delivered orders for revenue (delivered and rejected = paid orders)
        const { data: paidOrders, error: revenueError } = await supabase
          .from('orders')
          .select('total, status')
          .in('status', ['delivered', 'rejected']);

        if (revenueError) {
          console.error('Revenue fetch error:', revenueError);
        }

        console.log('Paid orders for revenue:', paidOrders);

        // Fetch total users
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch menu items count
        const { count: menuCount } = await supabase
          .from('menu_items')
          .select('*', { count: 'exact', head: true });

        // Fetch orders by status for breakdown
        const { data: allOrders } = await supabase
          .from('orders')
          .select('status');

        const statusCounts = allOrders?.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {}) || {};

        // Fetch recent orders with user details
        const { data: recent } = await supabase
          .from('orders')
          .select('*, profiles(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(5);

        // Calculate revenue from paid orders
        const revenue = (paidOrders || []).reduce((sum, order) => {
          const orderTotal = parseFloat(order.total) || 0;
          return sum + orderTotal;
        }, 0);

        console.log('Calculated revenue:', revenue);

        setStats({
          activeOrders: activeOrders?.length || 0,
          totalRevenue: revenue,
          totalUsers: userCount || 0,
          menuItems: menuCount || 0,
          ordersByStatus: statusCounts
        });

        setRecentOrders(recent || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up real-time subscription
    const subscription = supabase
      .channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchDashboardData)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const statCards = [
    {
      title: 'Active Orders',
      value: stats.activeOrders,
      icon: Icons.Orders,
      color: colors.primary,
      trend: '+12%'
    },
    {
      title: 'Total Revenue',
      value: `€${stats.totalRevenue.toFixed(2)}`,
      icon: Icons.Revenue,
      color: colors.success,
      trend: '+8%'
    },
    {
      title: 'Total Customers',
      value: stats.totalUsers,
      icon: Icons.Users,
      color: colors.info,
      trend: '+5%'
    },
    {
      title: 'Menu Items',
      value: stats.menuItems,
      icon: Icons.Menu,
      color: colors.warning,
      trend: '0%'
    },
  ];

  const getStatusColor = (status) => {
    const statusColors = {
      placed: colors.status.placed,
      accepted: colors.status.accepted,
      preparing: colors.status.preparing,
      sent: colors.status.sent,
      delivered: colors.status.delivered,
      rejected: colors.status.rejected
    };
    return statusColors[status] || colors.textMuted;
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LogoSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
          Dashboard
        </h1>
        <p style={{ color: colors.textMuted }}>
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = Icons.TrendUp;
          return (
            <div
              key={index}
              className="p-6 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                backgroundColor: colors.card,
                boxShadow: shadows.md
              }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="p-3 rounded-xl"
                  style={{
                    backgroundColor: `${stat.color}15`,
                    color: stat.color
                  }}
                >
                  <Icon />
                </div>
                <div
                  className="flex items-center gap-1 text-sm"
                  style={{ color: colors.success }}
                >
                  <TrendIcon />
                  {stat.trend}
                </div>
              </div>
              <div className="mt-4">
                <p
                  className="text-2xl font-bold"
                  style={{ color: colors.text }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: colors.textMuted }}
                >
                  {stat.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div
          className="lg:col-span-2 p-6 rounded-2xl"
          style={{
            backgroundColor: colors.card,
            boxShadow: shadows.md
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-xl font-bold"
              style={{ color: colors.text }}
            >
              Recent Orders
            </h2>
            <a
              href="/orders"
              className="text-sm font-medium transition-colors"
              style={{ color: colors.primary }}
            >
              View All →
            </a>
          </div>

          {recentOrders.length === 0 ? (
            <div
              className="text-center py-12 rounded-xl"
              style={{ backgroundColor: colors.background }}
            >
              <p style={{ color: colors.textMuted }}>
                No orders yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-xl transition-all hover:shadow-md"
                  style={{ backgroundColor: colors.background }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: `${getStatusColor(order.status)}15`,
                        color: getStatusColor(order.status)
                      }}
                    >
                      <Icons.Orders />
                    </div>
                    <div>
                      <p
                        className="font-semibold"
                        style={{ color: colors.text }}
                      >
                        Order #{order.id.slice(-8)}
                      </p>
                      <p
                        className="text-sm flex items-center gap-1"
                        style={{ color: colors.textMuted }}
                      >
                        <Icons.Clock />
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-bold"
                      style={{ color: colors.text }}
                    >
                      €{order.total?.toFixed(2)}
                    </p>
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${getStatusColor(order.status)}15`,
                        color: getStatusColor(order.status)
                      }}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div
          className="p-6 rounded-2xl"
          style={{
            backgroundColor: colors.card,
            boxShadow: shadows.md
          }}
        >
          <h2
            className="text-xl font-bold mb-6"
            style={{ color: colors.text }}
          >
            Order Status
          </h2>

          <div className="space-y-4">
            {Object.entries(stats.ordersByStatus)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getStatusColor(status) }}
                    />
                    <span
                      className="font-medium"
                      style={{ color: colors.text }}
                    >
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-bold"
                      style={{ color: colors.text }}
                    >
                      {count}
                    </span>
                    <div
                      className="w-24 h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: colors.background }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: getStatusColor(status),
                          width: `${Math.max((count / (stats.activeOrders + Object.values(stats.ordersByStatus).reduce((a, b) => a + b, 0))) * 100, 5)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t" style={{ borderColor: colors.borderLight }}>
            <h3
              className="font-semibold mb-4"
              style={{ color: colors.text }}
            >
              Quick Actions
            </h3>
            <div className="space-y-2">
              <a
                href="/menu"
                className="flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{ backgroundColor: colors.background }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = `${colors.primary}10`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = colors.background;
                }}
              >
                <span style={{ color: colors.primary }}>+</span>
                <span style={{ color: colors.text }}>Add Menu Item</span>
              </a>
              <a
                href="/orders"
                className="flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{ backgroundColor: colors.background }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = `${colors.primary}10`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = colors.background;
                }}
              >
                <span style={{ color: colors.primary }}>→</span>
                <span style={{ color: colors.text }}>Manage Orders</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;