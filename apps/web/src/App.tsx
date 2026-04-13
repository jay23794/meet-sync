import { useAuth } from './features/auth/hooks/useAuth';
import AuthPage from './features/auth/AuthPage';
import ChatPage from './features/chat/ChatPage';

export default function App() {
  const { session, logout } = useAuth();

  // Once the user has a valid guest session, drop them straight into chat.
  // If they log out (or the session is cleared), fall back to the auth screen.
  if (session) {
    return <ChatPage session={session} onLeave={logout} />;
  }

  return <AuthPage />;
}
