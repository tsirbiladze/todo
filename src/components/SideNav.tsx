"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { ThemeToggle } from "./ThemeToggle";
import { useStore } from "@/lib/store";

export function SideNav() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const categories = useStore((state) => state.categories);

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: HomeIcon,
    },
    {
      name: "Focus Mode",
      href: "/focus",
      icon: ClockIcon,
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: CalendarIcon,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: ChartBarIcon,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Cog6ToothIcon,
    },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      className={`relative flex flex-col bg-white transition-all duration-300 dark:bg-gray-800 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Todo App</h1>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center rounded-md p-2 ${
              pathname === item.href
                ? "bg-primary/10 text-primary"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            } ${isCollapsed ? "justify-center" : "px-4"}`}
          >
            <item.icon className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">{item.name}</span>}
          </Link>
        ))}

        {!isCollapsed && categories && categories.length > 0 && (
          <div className="pt-4">
            <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Categories
            </h2>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className="flex items-center rounded-md px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: category.color || '#6366f1' }}
                ></div>
                <span className="ml-3">{category.name}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="border-t border-gray-200 p-2 dark:border-gray-700">
        <div className={`flex ${isCollapsed ? "justify-center" : "justify-between"} items-center p-2`}>
          {!isCollapsed && <span className="text-sm text-gray-500 dark:text-gray-400">Theme</span>}
          <ThemeToggle smaller={isCollapsed} />
        </div>
      </div>
    </aside>
  );
} 