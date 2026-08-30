import '../styles/globals.css';
import { useEffect } from 'react';
import useAuthStore from '../store/authStore';

export default function App({ Component, pageProps }) {
  const { token, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token) fetchMe();
  }, [token]);

  return <Component {...pageProps} />;
}
