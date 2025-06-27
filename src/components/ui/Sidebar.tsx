import {
  Sparkles,
  FileText,
  Home,
  FolderOpen,
  Settings,
  LogOut,
} from 'lucide-react';
import { User } from "../../lib/data";
import { useRouter, usePathname } from 'next/navigation';
 
interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
  user: User;
}

export default function Sidebar({ isOpen, setIsOpen, onLogout, user }: SidebarProps) {

  const pathName = usePathname();

  const router = useRouter();
  const navItems = [
    { icon: Home, label: 'Overview', active: true, path: '/dashboard' },
    { icon: FolderOpen, label: 'Documents', active: false, path: '/documents' },
    { icon: Sparkles, label: 'Generate', active: false, path: '/generate' },
    { icon: FileText, label: 'Templates', active: false, path: '/templates' },
  ]

  const handleNavigation = (path: string) => {
    router.push(path);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={`fixed left-0 top-0 z-30 w-70 h-full bg-gray-800 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-[100vh] lg:z-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">AscendlyAI</h2>
                <p className="text-gray-300 text-sm">Generate & Edit</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navItems.map((item, index) => {
                const isActive = pathName === item.path;
                return (
                  <button 
                    key={index} 
                    onClick={() => handleNavigation(item.path)}
                    className={`cursor-pointer w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${isActive ? 'bg-blue-500 text-white' : 'text-gray-200 hover:bg-gray-700 hover:text-white'}`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-700">
            <button 
              onClick={() => router.push('/settings')}
              className="cursor-pointer w-full flex items-center space-x-3 px-4 py-3 text-gray-200 hover:bg-gray-700 hover:text-white rounded-lg transition-colors">
              <Settings size={20} />
              <span>Settings</span>
            </button>
            <button onClick={onLogout} className="cursor-pointer w-full flex items-center space-x-3 px-4 py-3 text-gray-200 hover:bg-gray-700 hover:text-white rounded-lg transition-colors">
              <LogOut size={20} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}