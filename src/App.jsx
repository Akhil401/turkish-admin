import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import PrivateRoute from './PrivateRoute';
import Login from './Login';
import Layout from './Layout';
import Dashboard from './Dashboard';
import MenuList from './MenuList';
import OrderList from './OrderList';
import UserList from './UserList';
import Chat from './Chat';

function App() {
  useEffect(() => {
    const initOneSignal = async () => {
      if (typeof window !== 'undefined' && window.OneSignal) {
        window.OneSignal.push(function () {
          window.OneSignal.init({
            appId: "bb4dc5c6-0c72-47e6-bb52-f0d755aaced4",
            safari_web_id: "web.onesignal.auto.4dd426e0-3d87-4d3a-8b3d-1b7a5e9c5c0e",
            notifyButton: {
              enable: true,
            },
            allowLocalhostAsSecureOrigin: true,
          });
        });

        window.OneSignal.push(function () {
          window.OneSignal.on('subscriptionChange', function (isSubscribed) {
            console.log('The user subscription state is now:', isSubscribed);
            if (isSubscribed) {
              window.OneSignal.getUserId(function (userId) {
                console.log('OneSignal User ID:', userId);
                localStorage.setItem('onesignal_user_id', userId);
              });
            }
          });
        });
      }
    };

    initOneSignal();
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