// src/shared/components/layout/Layout.tsx
import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { cn } from '../../utils/cn';

export interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-secondary-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-0">
        {/* Header */}
        <Header 
          onMenuClick={toggleSidebar}
          showSidebarToggle={true}
        />

        {/* Page content */}
        <main className={cn(
          'flex-1 overflow-auto',
          className
        )}>
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export { Layout };