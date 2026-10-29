import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import LogoSpinner from './components/LogoSpinner';

// Admin access is decided by the database (profiles.role = 'admin' via is_admin()),
// not by a fixed email, so any account the owner promotes to admin can log in.
function PrivateRoute({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async (session) => {
      const currentUser = session?.user || null;
      let admin = false;
      if (currentUser) {
        const { data, error } = await supabase.rpc('is_admin');
        admin = !error && data === true;
      }
      if (!cancelled) {
        setUser(currentUser);
        setIsAdmin(admin);
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => check(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      check(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <LogoSpinner />
    </div>
  );
  if (!user || !isAdmin) return <Navigate to="/login" />;
  return children;
}

export default PrivateRoute;
