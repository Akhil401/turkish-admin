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

          // Request permission first
          const granted = await OneSignal.Notifications.requestPermission();
          console.log('Push permission granted:', granted);
          if (!granted) {
            console.warn('Push permission denied by user');
            return;
          }

          // In OneSignal v16, the subscription ID is created ASYNCHRONOUSLY
          // after permission is granted. We must wait for the 'change' event.
          const subscriptionId = await new Promise((resolve) => {
            // Check if already available (e.g. returning user)
            const existingId = OneSignal.User?.pushSubscription?.id;
            if (existingId) {
              console.log('Subscription already exists:', existingId);
              resolve(existingId);
              return;
            }

            // pushSubscription might not be attached yet — guard against it
            if (!OneSignal.User?.pushSubscription) {
              console.error('OneSignal.User.pushSubscription is not available');
              resolve(null);
              return;
            }

            // Listen for the subscription to be created
            const handler = (event) => {
              const newId = event.current?.id;
              if (newId) {
                OneSignal.User.pushSubscription.removeEventListener('change', handler);
                resolve(newId);
              }
            };
            OneSignal.User.pushSubscription.addEventListener('change', handler);

            // Timeout after 15 seconds to avoid hanging
            setTimeout(() => {
              OneSignal.User?.pushSubscription?.removeEventListener('change', handler);
              resolve(null);
            }, 15000);
          });

          if (subscriptionId) {
            console.log('OneSignal Subscription ID:', subscriptionId);
            localStorage.setItem('onesignal_user_id', subscriptionId);

            const { error } = await supabase
              .from('one_signal_tokens')
              .upsert({
                user_id: userId,
                player_id: subscriptionId
              }, {
                onConflict: 'user_id'
              });

            if (error) {
              console.error('Error saving OneSignal token:', error);
            } else {
              console.log('✅ OneSignal token saved to database successfully');
            }
          } else {
            console.error('OneSignal Subscription ID not available after 15s timeout');
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