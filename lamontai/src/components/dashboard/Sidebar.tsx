'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  FileTextIcon, 
  BarChartIcon, 
  SettingsIcon, 
  CreditCardIcon 
} from 'lucide-react';
import { getUserData, isAuthenticated } from '@/lib/auth-utils';
import LogoutButton from '@/components/LogoutButton';

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // Get user data from session storage
    const fetchUserData = async () => {
      const userData = await getUserData();
      if (userData) {
        setUser(userData);
      }
    };
    
    fetchUserData();
  }, []);

  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check authentication before navigating
    isAuthenticated().then(authenticated => {
      if (!authenticated) {
        console.log('Not authenticated, redirecting to login');
        router.push('/auth/login');
        return;
      }
      
      console.log(`Navigating to: ${href}`);
      router.push(href);
    });
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white shadow-sm">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8">
            {/* Logo placeholder */}
            <div className="h-full w-full rounded-md bg-orange-500"></div>
          </div>
          <span className="text-xl font-bold">Lamont.ai</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <NavItem 
          href="/dashboard" 
          icon={<HomeIcon size={20} />} 
          label="Overview" 
          active={pathname === '/dashboard'} 
          onClick={handleNavigation}
        />
        <NavItem 
          href="/dashboard/content" 
          icon={<FileTextIcon size={20} />} 
          label="Content Plan" 
          active={pathname === '/dashboard/content'}
          onClick={handleNavigation} 
        />
        <NavItem 
          href="/dashboard/analytics" 
          icon={<BarChartIcon size={20} />} 
          label="Analytics" 
          active={pathname === '/dashboard/analytics'} 
          onClick={handleNavigation}
        />
        <NavItem 
          href="/dashboard/settings" 
          icon={<SettingsIcon size={20} />} 
          label="Settings" 
          active={pathname === '/dashboard/settings'} 
          onClick={handleNavigation}
        />
        <NavItem 
          href="/dashboard/billing" 
          icon={<CreditCardIcon size={20} />} 
          label="Billing" 
          active={pathname === '/dashboard/billing'} 
          onClick={handleNavigation}
        />
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gray-200"></div>
          <div className="text-sm">
            <p className="font-medium">{user?.name || 'User Name'}</p>
            <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
          </div>
        </div>
        <div className="mt-4">
          <LogoutButton
            className="w-full items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            variant="text"
            showText={true}
          />
        </div>
      </div>
    </div>
  );
};

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: (href: string, e: React.MouseEvent) => void;
}

const NavItem = ({ href, icon, label, active = false, onClick }: NavItemProps) => {
  return (
    <a
      href={href}
      onClick={(e) => onClick && onClick(href, e)}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
        active
          ? 'bg-orange-50 text-orange-500 font-medium'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
      data-testid={`nav-${label.toLowerCase().replace(' ', '-')}`}
    >
      <span className={active ? 'text-orange-500' : 'text-gray-500'}>{icon}</span>
      <span>{label}</span>
    </a>
  );
};

export default Sidebar; 