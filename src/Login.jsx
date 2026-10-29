import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { toast } from 'react-hot-toast';
import { colors, shadows } from './theme';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            // Only accounts with profiles.role = 'admin' may use the panel.
            const { data: admin, error: roleError } = await supabase.rpc('is_admin');
            if (roleError || admin !== true) {
                await supabase.auth.signOut();
                throw new Error('Questo account non è un amministratore. / This account is not an admin.');
            }
            toast.success('Bentornato, Admin!');
            navigate('/');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ backgroundColor: colors.background }}
        >
            <div
                className="w-full max-w-md p-8 rounded-2xl"
                style={{
                    backgroundColor: colors.card,
                    boxShadow: shadows.xl
                }}
            >
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center overflow-hidden">
                        <img 
                            src="https://i.imgur.com/SXiYUHr.png" 
                            alt="Turkish Kelleci Logo" 
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h1
                        className="text-2xl font-bold mb-2"
                        style={{ color: colors.text }}
                    >
                        Portale Admin
                    </h1>
                    <p style={{ color: colors.textMuted }}>
                        Gestione Turkish Kelleci
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: colors.text }}
                        >
                            Indirizzo Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@turkishkelleci.com"
                            className="w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2"
                            style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                color: colors.text,
                                boxShadow: shadows.sm
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = colors.primary;
                                e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = colors.border;
                                e.target.style.boxShadow = shadows.sm;
                            }}
                            required
                        />
                    </div>

                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: colors.text }}
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none"
                            style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                color: colors.text,
                                boxShadow: shadows.sm
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = colors.primary;
                                e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = colors.border;
                                e.target.style.boxShadow = shadows.sm;
                            }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{
                            backgroundColor: colors.primary,
                            color: colors.textInverse,
                            boxShadow: shadows.md
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) e.target.style.backgroundColor = colors.primaryHover;
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = colors.primary;
                        }}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Accesso in corso...
                            </span>
                        ) : (
                            'Accedi'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                        Turkish Kelleci Pizzeria & Grill
                    </p>
                    <p style={{ color: colors.textLight, fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        Accesso Riservato agli Amministratori
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;