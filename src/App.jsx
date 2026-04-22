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

      if (typeof window !== 'undefined' && window.OneSignal) {
        console.log('OneSignal is available');

        window.OneSignal.push(function () {
          console.log('Inside OneSignal.push');

          // Show native prompt
          window.OneSignal.showNativePrompt();

          // Wait a bit for user to respond, then get ID
          setTimeout(async () => {
            window.OneSignal.getUserId(async function (playerId) {
              console.log('OneSignal User ID:', playerId);
              if (playerId) {
                localStorage.setItem('onesignal_user_id', playerId);

                const { error } = await supabase
                  .from('one_signal_tokens')
                  .upsert({
                    user_id: userId,
                    player_id: playerId
                  }, {
                    onConflict: 'user_id'
                  });

                if (error) {
                  console.error('Error saving OneSignal token:', error);
                } else {
                  console.log('OneSignal token saved to database');
                }
              } else {
                console.log('No OneSignal User ID returned');
              }
            });
          }, 3000);
        });
      } else {
        console.error('OneSignal is not available');
      }
    } catch (e) {
      console.error('Error in saveOneSignalToken:', e);
    }
  };

  useEffect(() => {
    const initOneSignal = async () => {
      console.log('Initializing OneSignal...');

      if (typeof window !== 'undefined') {
        console.log('Window is defined');

        if (window.OneSignal) {
          console.log('OneSignal is loaded');

          window.OneSignal.push(function () {
            console.log('OneSignal.push called');

            window.OneSignal.init({
              appId: "bb4dc5c6-0c72-47e6-bb52-f0d755aaced4",
              safari_web_id: "web.onesignal.auto.4dd426e0-3d87-4d3a-8b3d-1b7a5e9c5c0e",
              notifyButton: {
                enable: true,
              },
              allowLocalhostAsSecureOrigin: true,
              promptOptions: {
                slidedown: {
                  prompts: [
                    {
                      type: "push",
                      autoPrompt: true,
                      text: {
                        actionMessage: "We'd like to show you notifications for new orders and messages",
                        acceptButton: "Allow",
                        cancelButton: "No thanks",
                      },
                    },
                  ],
                },
              },
            });

            console.log('OneSignal.init called');
          });

          window.OneSignal.push(function () {
            window.OneSignal.on('subscriptionChange', async function (isSubscribed) {
              console.log('The user subscription state is now:', isSubscribed);
              if (isSubscribed) {
                window.OneSignal.getUserId(async function (userId) {
                  console.log('OneSignal User ID:', userId);
                  localStorage.setItem('onesignal_user_id', userId);

                  // Get current user from Supabase
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    // Save to one_signal_tokens table
                    const { error } = await supabase
                      .from('one_signal_tokens')
                      .upsert({
                        user_id: user.id,
                        player_id: userId
                      }, {
                        onConflict: 'user_id'
                      });

                    if (error) {
                      console.error('Error saving OneSignal token:', error);
                    } else {
                      console.log('OneSignal token saved to database');
                    }
                  }
                });
              }
            });
          });

          // Also check on initialization
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            console.log('User is logged in, saving OneSignal token');
            saveOneSignalToken(user.id);
          }
        } else {
          console.error('OneSignal is not loaded. Check if the script is included in index.html');
        }
      }
    };

    // Wait for OneSignal to load
    const timeout = setTimeout(() => {
      initOneSignal();
    }, 2000);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, saving OneSignal token');
        saveOneSignalToken(session.user.id);
      }
    });

    return () => {
      clearTimeout(timeout);
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