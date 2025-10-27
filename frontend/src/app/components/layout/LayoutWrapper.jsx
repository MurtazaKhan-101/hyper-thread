'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import AppLayout from './AppLayout';

const LayoutWrapper = ({ children }) => {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  // Pages that should NOT use the app layout (auth pages, etc.)
  const authPages = [
    '/auth/login',
    '/auth/signup', 
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-otp',
    '/auth/verify-reset-otp',
    '/auth/oauth-success',
    '/onboarding'
  ];

  const isAuthPage = authPages.includes(pathname) || pathname === '/';
  const shouldUseAppLayout = !isAuthPage && isAuthenticated;

  if (shouldUseAppLayout) {
    return <AppLayout>{children}</AppLayout>;
  }

  return children;
};

export default LayoutWrapper;