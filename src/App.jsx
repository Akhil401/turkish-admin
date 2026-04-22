import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PrivateRoute from './PrivateRoute';
import Login from './Login';
import Layout from './Layout';
import Dashboard from './Dashboard';
import MenuList from './MenuList';
import OrderList from './OrderList';
import UserList from './UserList';
import Chat from './Chat';

function App() {
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