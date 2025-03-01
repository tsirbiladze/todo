"use client";

import { PlusIcon } from "@heroicons/react/24/solid";

interface QuickCaptureButtonProps {
  onClick: () => void;
}

export function QuickCaptureButton({ onClick }: QuickCaptureButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-primary dark:focus:ring-offset-gray-900"
      aria-label="Add task"
    >
      <PlusIcon className="h-6 w-6 text-white" />
    </button>
  );
} 