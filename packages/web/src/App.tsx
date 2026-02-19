import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Login } from './pages/Login';
import { Users } from './pages/Users';
import Dashboard from './pages/Dashboard';
import WorkflowList from './pages/WorkflowList';
import WorkflowNew from './pages/WorkflowNew';
import WorkflowDetail from './pages/WorkflowDetail';
import WorkflowReport from './pages/WorkflowReport';
import ConfigList from './pages/ConfigList';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/workflows" element={<WorkflowList />} />
                  <Route path="/workflows/new" element={<WorkflowNew />} />
                  <Route path="/workflows/:workflowId" element={<WorkflowDetail />} />
                  <Route path="/workflows/:workflowId/report" element={<WorkflowReport />} />
                  <Route path="/configs" element={<ConfigList />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute requireAdmin>
                        <Users />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
