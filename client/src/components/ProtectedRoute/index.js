import { useRouter } from 'next/router';
import { useEffect } from 'react';
import useAuthStore from '../../store/authStore';

export default function ProtectedRoute({ children }) {
  const { user, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!token && !user) router.replace('/login');
  }, [token, user, router]);

  if (!token && !user) return null;
  return children;
}
