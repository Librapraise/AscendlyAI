import { Menu, User as UserIcon, Search } from 'lucide-react'
import { User } from '../../lib/data'
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';


interface TopNavProps {
  onMenuClick: () => void;
  user: User;
}

export default function TopNav({ onMenuClick, user: userProp }: TopNavProps) {

  //routing to profile page
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleProfileClick = () => {
      router.push('/profile');
  };

  const pathName = usePathname();

  const pagePaths: Record<string, string> = {
    '/dashboard': 'Overview',
    '/profile': 'Profile',
    '/settings': 'Settings',
    '/documents': 'Documents',
    '/generate': 'Generate',
    'templates': 'Templates',
  }

  const pagePath = pagePaths[pathName] || 'Page'

  return (
    <header className="sticky bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onMenuClick} className="lg:hidden p-2 text-gray-300 hover:bg-gray-700 rounded-lg">
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{pagePath}</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-gray-300 text-sm hidden md:block">Hello, {userProp.name}</span>
              {/* User Profile */}
            <div className="relative group ">
              <button
                onClick={handleProfileClick}
                className="cursor-pointer flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <UserIcon size={18} className="text-white" />
                </div>
                {/**
                <div className="hidden md:block text-left">
                  <p className="text-white text-sm font-medium">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
                */}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}