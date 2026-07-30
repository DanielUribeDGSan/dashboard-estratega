import React from 'react';
import { Home, Users, BookOpen, LayoutGrid, HelpCircle, LogOut } from 'lucide-react';
import { BbvaMark } from '../ui/BbvaMark';

interface SidebarProps {
  currentPath?: string;
  mobile?: boolean;
}

const navItems = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: Users, label: 'Usuarios', path: '/users' },
  { icon: BookOpen, label: 'Artículos', path: '/articles' },
  { icon: LayoutGrid, label: 'Secciones', path: '/sections' },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPath = '/', mobile = false }) => {
  return (
    <aside className={mobile ? "flex h-full w-full flex-col bg-white p-5" : "fixed left-0 top-0 z-20 hidden h-screen w-20 flex-col items-center border-r border-gray-100 bg-white py-6 shadow-sm lg:flex"}>
      <div className={mobile ? "mb-8 flex items-center gap-3" : "mb-12"}>
        <BbvaMark />
        {mobile && <div><p className="font-semibold text-[#001391]">Analytics</p><p className="text-xs text-slate-500">Estratega Life</p></div>}
      </div>

      <nav className={mobile ? "flex w-full flex-col gap-2" : "flex w-full flex-col gap-6 px-4"}>
        {navItems.map((item) => {
          // Normalize paths for matching
          const current = currentPath.endsWith('/') && currentPath.length > 1 ? currentPath.slice(0, -1) : currentPath;
          const isActive = current === item.path || (item.path !== '/' && current.startsWith(item.path));
          
          return (
            <a
              key={item.path}
              href={item.path}
              className={`flex items-center ${mobile ? 'h-12 justify-start gap-3 px-4' : 'aspect-square justify-center'} w-full rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'bg-secondary text-white shadow-md shadow-secondary/30'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
              }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              {mobile && <span className="text-sm font-medium">{item.label}</span>}
            </a>
          );
        })}
      </nav>

      <div className={mobile ? "mt-auto flex w-full flex-col gap-2" : "mt-auto flex w-full flex-col gap-6 px-4"}>
        <button
          onClick={() => {
            window.localStorage.removeItem('site_access_granted');
            window.location.assign('/');
          }}
          className={`flex items-center ${mobile ? 'h-12 justify-start gap-3 px-4' : 'aspect-square justify-center'} w-full rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-all`}
        >
          <HelpCircle className="w-5 h-5" />
          {mobile && <span>Ayuda</span>}
        </button>
        <button className={`flex items-center ${mobile ? 'h-12 justify-start gap-3 px-4' : 'aspect-square justify-center'} w-full rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-all`}>
          <LogOut className="w-5 h-5" />
          {mobile && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
};
