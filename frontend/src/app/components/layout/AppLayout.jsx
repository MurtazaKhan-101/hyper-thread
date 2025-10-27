'use client';

import { useState } from 'react';
import Sidebar from './sidebar';
import Topbar from './Topbar';

const AppLayout = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Topbar - Full Width at Top */}
      <Topbar setIsMobileOpen={setIsMobileOpen} />
      
      {/* Content Area with Sidebar */}
      <div className="flex pt-14">
        {/* Sidebar */}
        <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
        
        {/* Main Content Area */}
        <main className="flex-1 lg:ml-72">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;