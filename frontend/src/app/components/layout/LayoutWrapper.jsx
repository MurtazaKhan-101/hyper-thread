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

  // Show loading spinner while determining auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-buttons-gradient"></div>
      </div>
    );
  }

  const shouldUseAppLayout = !isAuthPage && isAuthenticated;

  if (shouldUseAppLayout) {
    return <AppLayout>{children}</AppLayout>;
  }

  return children;
};

export default LayoutWrapper;