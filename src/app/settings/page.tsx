'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Tab } from '@headlessui/react';
import { useSession } from 'next-auth/react';
import {
  UserIcon,
  PaintBrushIcon,
  BellIcon,
  ClockIcon,
  KeyIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const tabs = [
  { name: 'Profile', icon: UserIcon },
  { name: 'Appearance', icon: PaintBrushIcon },
  { name: 'Notifications', icon: BellIcon },
  { name: 'Focus Mode', icon: ClockIcon },
  { name: 'Shortcuts', icon: KeyIcon },
  { name: 'Accessibility', icon: ShieldCheckIcon },
  { name: 'Advanced', icon: Cog6ToothIcon },
];

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Settings</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Manage your account settings and preferences.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
          <h2 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">Profile Settings</h2>
          <p className="text-blue-600 dark:text-blue-400 text-sm">
            Update your personal information, email address, and profile picture.
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800/30">
          <h2 className="text-lg font-medium text-purple-800 dark:text-purple-300 mb-2">Preferences</h2>
          <p className="text-purple-600 dark:text-purple-400 text-sm">
            Customize your experience with theme preferences and view options.
          </p>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800/30">
          <h2 className="text-lg font-medium text-amber-800 dark:text-amber-300 mb-2">Notification Settings</h2>
          <p className="text-amber-600 dark:text-amber-400 text-sm">
            Control when and how you receive notifications about your tasks.
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800/30">
          <h2 className="text-lg font-medium text-green-800 dark:text-green-300 mb-2">Security</h2>
          <p className="text-green-600 dark:text-green-400 text-sm">
            Manage your password, two-factor authentication, and account security.
          </p>
        </div>
      </div>
    </div>
  );
} 