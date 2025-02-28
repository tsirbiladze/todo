'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ThemeToggle } from './ThemeToggle';
import { 
  Bars3Icon, 
  XMarkIcon, 
  HomeIcon, 
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { Transition } from '@headlessui/react';
import { useSession, signOut } from 'next-auth/react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Focus', href: '/focus', icon: ClockIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Recurring Tasks', href: '/recurring-tasks', icon: ArrowPathIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState(3); // Example notification count
  const { data: session, status } = useSession();
  const focusMode = useStore((state) => state.focusMode);
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Add scroll detection for enhanced header behavior
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const isAuthenticated = status === 'authenticated' && session;

  return (
    <header
      className={`${
        scrolled 
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md border-transparent'
          : 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800'
      } transition-all duration-300 fixed top-0 left-0 right-0 z-50
        ${focusMode ? 'opacity-40 hover:opacity-100' : ''}`}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-3 lg:px-8"
        aria-label="Global"
      >
        <div className="flex items-center lg:flex-1">
          <Link 
            href="/" 
            className="flex items-center gap-2 -m-1.5 p-1.5"
          >
            <div className="bg-indigo-600 text-white p-2 rounded-md flex items-center justify-center">
              <CheckCircleSolid className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400">
              TaskMaster
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/80'
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                  }`}
                  aria-hidden="true"
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User & Theme Controls */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4 items-center">
          {/* Notifications */}
          <button
            type="button"
            className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-5 w-5" aria-hidden="true" />
            {notifications > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                {notifications}
              </span>
            )}
          </button>

          <ThemeToggle />

          {isAuthenticated ? (
            <div className="relative inline-block text-left">
              <div className="group">
                <button
                  type="button"
                  className="flex items-center gap-x-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <span className="inline-block h-8 w-8 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User avatar'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="h-full w-full text-gray-500 dark:text-gray-400" />
                    )}
                  </span>
                  <span className="hidden md:inline-block">{session.user?.name || 'User'}</span>
                </button>
                
                <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transform opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 invisible group-hover:visible">
                  <div className="py-1 divide-y divide-gray-100 dark:divide-gray-700">
                    <div className="px-4 py-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as</p>
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{session.user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/settings/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                        Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/api/auth/signin"
              className="flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <UserCircleIcon className="h-5 w-5" />
              <span>Sign in</span>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <Transition
        show={mobileMenuOpen}
        enter="transition duration-200 ease-out"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition duration-150 ease-in"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-2"
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        <div className="fixed inset-x-0 top-16 z-50 px-4 pt-4 pb-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="space-y-1 py-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-x-3 rounded-md px-3 py-2 text-base font-semibold ${
                    isActive 
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon
                    className={`h-6 w-6 ${
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
          
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {session?.user?.image ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={session.user.image}
                      alt=""
                    />
                  ) : (
                    <UserCircleIcon className="h-10 w-10 rounded-full text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800 dark:text-white">
                    {session?.user?.name || 'User'}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {session?.user?.email || ''}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <div>
                  <ThemeToggle />
                </div>
                
                <button
                  type="button"
                  className="relative ml-auto flex-shrink-0 rounded-full bg-white dark:bg-gray-800 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  {notifications > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                      {notifications}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            <div className="mt-3 space-y-1">
              <Link
                href="/settings/profile"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Your Profile
              </Link>
              
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href="/api/auth/signin"
                  className="block rounded-md px-3 py-2 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </Transition>
    </header>
  );
}
