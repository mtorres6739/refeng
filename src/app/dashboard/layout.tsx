'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import {
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  GiftIcon,
  CogIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { NotificationBell } from '@/components/notifications/notification-bell';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Referrals', href: '/dashboard/referrals', icon: UsersIcon },
  { name: 'Content', href: '/dashboard/content', icon: DocumentTextIcon },
  { name: 'Drawings', href: '/dashboard/drawings', icon: GiftIcon },
  { name: 'Users', href: '/dashboard/users', icon: UsersIcon },
  { name: 'Organizations', href: '/dashboard/organizations', icon: BuildingOfficeIcon, role: 'SUPER_ADMIN' },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    console.log('Session:', session);
    console.log('Session status:', status);
    console.log('Organization:', session?.user?.organization);
  }, [session, status]);

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="flex-none w-64 min-w-[250px] bg-white shadow-lg min-h-screen">
          <div className="p-4">
            <h1 className="text-xl font-bold">Referral Engine</h1>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <BuildingOfficeIcon className="h-4 w-4 mr-1" />
              {session.user?.organization?.name || 'No Organization'}
            </div>
          </div>
          <nav className="mt-4">
            {navigation
              .filter((item) => !item.role || item.role === session.user?.role)
              .map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-sm ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
          </nav>
          {/* User info at bottom of sidebar */}
          <div className="absolute bottom-0 w-64 border-t border-gray-200">
            <div className="p-4">
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center flex-1"
                  >
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session.user.name}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="truncate mr-2">{session.user.email}</span>
                      </div>
                    </div>
                    {isUserMenuOpen ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <NotificationBell />
                </div>
                {isUserMenuOpen && (
                  <div className="absolute bottom-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg py-1">
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
