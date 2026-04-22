import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { supabase } from './supabaseClient';
import PrivateRoute from './PrivateRoute';
import Login from './Login';
import Layout from './Layout';
import Dashboard from './Dashboard';
import MenuList from './MenuList';
import OrderList from './OrderList';
import UserList from './UserList';
import Chat from './Chat';

function App() {
  const saveOneSignalToken = async (userId) => {
    try {
      console.log('saveOneSignalToken called for user:', userId);

      if (typeof window !== 'undefined' && window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function (OneSignal) {
          console.log('OneSignal is available (v16)');

          // Show native prompt
          await OneSignal.Notifications.requestPermission();

          // Get the subscription ID
          const subscription = await OneSignal.User.pushSubscription;
          if (subscription && subscription.id) {
            console.log('OneSignal Subscription ID:', subscription.id);
            localStorage.setItem('onesignal_user_id', subscription.id);

            const { error } = await supabase
              .from('one_signal_tokens')
              .upsert({
                user_id: userId,
                player_id: subscription.id
              }, {
                onConflict: 'user_id'
              });

            if (error) {
              console.error('Error saving OneSignal token:', error);
            } else {
              console.log('OneSignal token saved to database');
            }
          } else {
            console.log('No OneSignal Subscription ID returned');
          }
        });
      } else {
        console.error('OneSignalDeferred is not available');
      }
    } catch (e) {
      console.error('Error in saveOneSignalToken:', e);
    }
  };

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, saving OneSignal token');
        saveOneSignalToken(session.user.id);
      }
    });

    // Also check on initialization
    if (typeof window !== 'undefined' && window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function (OneSignal) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('User is logged in, saving OneSignal token');
          saveOneSignalToken(user.id);
        }
      });
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/menu" element={<MenuList />} />
                  <Route path="/orders" element={<OrderList />} />
                  <Route path="/users" element={<UserList />} />
                  <Route path="/chat" element={<Chat />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;