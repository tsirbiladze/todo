import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const themes = [
  { id: 'light', name: 'Light', icon: SunIcon },
  { id: 'dark', name: 'Dark', icon: MoonIcon },
  { id: 'system', name: 'System', icon: ComputerDesktopIcon },
];

export function ThemeToggle() {
  const preferences = useStore((state) => state.preferences);
  const updatePreferences = useStore((state) => state.updatePreferences);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const currentTheme = themes.find((t) => t.id === preferences.theme) || themes[2]; // Default to system

  return (
    <Listbox
      value={currentTheme}
      onChange={(selected) => {
        updatePreferences({ theme: selected.id as 'light' | 'dark' | 'system' });
      }}
    >
      <div className="relative">
        <Listbox.Button className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
          {({ open }) => (
            <>
              <span className="sr-only">Change theme</span>
              <currentTheme.icon
                className={`h-5 w-5 text-gray-700 dark:text-gray-200 ${
                  open ? 'scale-110' : ''
                } transition-transform duration-200`}
                aria-hidden="true"
              />
            </>
          )}
        </Listbox.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Listbox.Options className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1">
            {themes.map((theme) => (
              <Listbox.Option
                key={theme.id}
                value={theme}
                className={({ active, selected }) =>
                  `${
                    active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'
                  } ${
                    selected ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                  } cursor-pointer select-none relative px-4 py-2`
                }
              >
                {({ selected }) => (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <theme.icon className="h-4 w-4 mr-2" aria-hidden="true" />
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        {theme.name}
                      </span>
                    </div>
                    {selected && (
                      <span className="text-primary-600 dark:text-primary-400">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
} 