import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import LogoSpinner from './components/LogoSpinner';

function PrivateRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = user && user.email === 'arondla909@gmail.com';

  if (loading) return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <LogoSpinner />
    </div>
  );
  if (!user || !isAdmin) return <Navigate to="/login" />;
  return children;
}

export default PrivateRoute;