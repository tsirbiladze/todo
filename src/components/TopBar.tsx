"use client";

import { useState } from "react";
import { 
  MagnifyingGlassIcon, 
  BellIcon, 
  UserCircleIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { useStore } from "@/lib/store";

interface TopBarProps {
  onAddTask: () => void;
}

export function TopBar({ onAddTask }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const user = useStore((state) => state.user);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Search for:", searchQuery);
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center">
        <button
          onClick={onAddTask}
          className="mr-4 flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <PlusIcon className="mr-1 h-4 w-4" />
          New Task
        </button>

        <form onSubmit={handleSearch} className="hidden sm:block">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border-0 bg-gray-50 py-1.5 pl-10 pr-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-primary"
              placeholder="Search tasks..."
            />
          </div>
        </form>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
          <span className="sr-only">View notifications</span>
          <BellIcon className="h-6 w-6" />
          <span className="absolute right-0 top-0 flex h-2 w-2 items-center justify-center rounded-full bg-red-500"></span>
        </button>

        <div className="flex items-center">
          <div className="mr-2 hidden text-right text-sm sm:block">
            <p className="font-medium text-gray-900 dark:text-white">
              {user?.name || "Guest User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.email || "Sign in to sync"}
            </p>
          </div>
          <UserCircleIcon className="h-8 w-8 text-gray-400" />
        </div>
      </div>
    </header>
  );
} 