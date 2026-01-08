import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useEffect } from 'react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';
import MobileLayout from '@/layouts/MobileLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ChatPage from '@/pages/chat/ChatPage';
import HomePage from '@/pages/HomePage';
import ProfilePage from '@/pages/user/ProfilePage';
import EnhancedProfilePage from '@/pages/user/EnhancedProfilePage';
import SavedMessagesPage from '@/pages/SavedMessagesPage';
import JoinGroupPage from '@/pages/JoinGroupPage';
import MobileHomePage from '@/pages/mobile/MobileHomePage';
import MobileChatPage from '@/pages/mobile/MobileChatPage';
import MobileContactsPage from '@/components/mobile/MobileContactsPage';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { setIsMobile } = useUIStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  const { isMobile } = useUIStore();

  if (isMobile) {
    return (
      <ThemeProvider>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          
          <Route element={<MobileLayout />}>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MobileHomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat/:chatId"
            element={
              <PrivateRoute>
                <MobileChatPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <PrivateRoute>
                <MobileContactsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <PrivateRoute>
                <EnhancedProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <PrivateRoute>
                <SavedMessagesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/join/:code"
            element={
              <PrivateRoute>
                <JoinGroupPage />
              </PrivateRoute>
            }
          />
          </Route>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        
        <Route element={<MainLayout />}>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <PrivateRoute>
              <EnhancedProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/saved"
          element={
            <PrivateRoute>
              <SavedMessagesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/join/:code"
          element={
            <PrivateRoute>
              <JoinGroupPage />
            </PrivateRoute>
          }
        />
          <Route
            path="/contacts"
            element={
              <PrivateRoute>
                <MobileContactsPage />
              </PrivateRoute>
            }
          />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;

