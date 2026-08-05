import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { DashboardExportProvider } from './DashboardExportContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, currentPath = '/' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  return (
    <DashboardExportProvider><div className="min-h-screen bg-background flex w-full">
      <Sidebar currentPath={currentPath} />
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[min(19rem,85vw)] border-0 p-0">
          <SheetTitle className="sr-only">Menú principal</SheetTitle>
          <Sidebar currentPath={currentPath} mobile />
        </SheetContent>
      </Sheet>
      <div className="relative flex min-h-screen min-w-0 flex-1 flex-col lg:ml-24">
        <Topbar currentPath={currentPath} onMenuClick={() => setMobileMenuOpen(true)} />
        <main data-dashboard-export className="min-w-0 flex-1 px-4 pb-6 pt-3 sm:px-6 sm:pb-8 lg:px-8 lg:pt-4">
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div></DashboardExportProvider>
  );
};
