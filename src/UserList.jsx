import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { toast } from 'react-hot-toast';
import { t } from './translations';
import LogoSpinner from './components/LogoSpinner';
import { colors, shadows } from './theme';

// Icons
const Icons = {
    Search: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    User: () => (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    Mail: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    Phone: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
    ),
    Calendar: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    Users: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    )
};

function UserList() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, withPhone: 0, newThisMonth: 0 });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        let filtered = users;

        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone?.includes(searchTerm)
            );
        }

        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const userList = data || [];
            setUsers(userList);
            setFilteredUsers(userList);

            // Calculate stats
            const withPhone = userList.filter(u => u.phone).length;
            const now = new Date();
            const newThisMonth = userList.filter(u => {
                if (!u.created_at) return false;
                const created = new Date(u.created_at);
                return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
            }).length;

            setStats({
                total: userList.length,
                withPhone,
                newThisMonth
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Impossibile caricare i clienti');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

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
                        Clienti
                    </h1>
                    <p style={{ color: colors.textMuted }}>
                        {filteredUsers.length} clienti registrati
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    className="p-6 rounded-2xl"
                    style={{ backgroundColor: colors.card, boxShadow: shadows.md }}
                >
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                        >
                            <Icons.Users />
                        </div>
                        <div>
                            <p className="text-2xl font-bold" style={{ color: colors.text }}>
                                {stats.total}
                            </p>
                            <p style={{ color: colors.textMuted }}>Clienti Totali</p>
                        </div>
                    </div>
                </div>

                <div
                    className="p-6 rounded-2xl"
                    style={{ backgroundColor: colors.card, boxShadow: shadows.md }}
                >
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${colors.success}15`, color: colors.success }}
                        >
                            <Icons.Phone />
                        </div>
                        <div>
                            <p className="text-2xl font-bold" style={{ color: colors.text }}>
                                {stats.withPhone}
                            </p>
                            <p style={{ color: colors.textMuted }}>Con Numero di Telefono</p>
                        </div>
                    </div>
                </div>

                <div
                    className="p-6 rounded-2xl"
                    style={{ backgroundColor: colors.card, boxShadow: shadows.md }}
                >
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${colors.info}15`, color: colors.info }}
                        >
                            <Icons.Calendar />
                        </div>
                        <div>
                            <p className="text-2xl font-bold" style={{ color: colors.text }}>
                                {stats.newThisMonth}
                            </p>
                            <p style={{ color: colors.textMuted }}>Nuovi Questo Mese</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div
                className="p-4 rounded-2xl"
                style={{ backgroundColor: colors.card, boxShadow: shadows.md }}
            >
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }}>
                        <Icons.Search />
                    </div>
                    <input
                        type="text"
                        placeholder="Cerca per nome, email o telefono..."
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
            </div>

            {/* Users Grid */}
            {filteredUsers.length === 0 ? (
                <div
                    className="text-center py-16 rounded-2xl"
                    style={{ backgroundColor: colors.card, boxShadow: shadows.md }}
                >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.background }}>
                        <Icons.User />
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
                        Nessun cliente trovato
                    </h3>
                    <p style={{ color: colors.textMuted }}>
                        {searchTerm ? 'Prova a modificare la ricerca' : 'Nessun cliente registrato'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="rounded-2xl p-5 transition-all duration-200 hover:shadow-lg"
                            style={{ backgroundColor: colors.card, boxShadow: shadows.md }}
                        >
                            {/* Avatar & Name */}
                            <div className="flex items-center gap-4 mb-4">
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
                                    style={{
                                        backgroundColor: colors.primary,
                                        color: colors.textInverse
                                    }}
                                >
                                    {getInitials(user.full_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold truncate" style={{ color: colors.text }}>
                                        {user.full_name || 'Sconosciuto'}
                                    </h3>
                                    <p className="text-sm" style={{ color: colors.textMuted }}>
                                        Cliente
                                    </p>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3">
                                {user.email && (
                                    <div className="flex items-center gap-3 text-sm" style={{ color: colors.textLight }}>
                                        <Icons.Mail />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                )}
                                {user.phone && (
                                    <div className="flex items-center gap-3 text-sm" style={{ color: colors.textLight }}>
                                        <Icons.Phone />
                                        <span>{user.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm" style={{ color: colors.textMuted }}>
                                    <Icons.Calendar />
                                    <span>Registrato {formatDate(user.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default UserList;