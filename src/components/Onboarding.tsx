"use client";

import { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useStore } from "@/lib/store";
import { Fragment } from "react";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  
  const steps = [
    {
      title: "Welcome to your Todo App!",
      description: "Let's quickly show you around so you can get started right away.",
      image: "/onboarding/welcome.svg"
    },
    {
      title: "Create tasks easily",
      description: "Click the + button to add new tasks. You can set priorities, due dates, and add notes.",
      image: "/onboarding/add-task.svg"
    },
    {
      title: "Organize with categories",
      description: "Group similar tasks together using categories to keep your workflow organized.",
      image: "/onboarding/categories.svg"
    },
    {
      title: "Track your progress",
      description: "Mark tasks as complete and see your productivity grow over time.",
      image: "/onboarding/progress.svg"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    localStorage.setItem("onboardingComplete", "true");
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => {}}>
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Background overlay */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="relative mx-auto max-w-xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
              <button
                onClick={handleSkip}
                className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              
              <div className="mb-6 flex justify-center">
                <div className="flex space-x-2">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-8 rounded-full ${
                        index === currentStep
                          ? "bg-primary"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="text-center">
                <div className="mb-6 flex justify-center">
                  <img 
                    src={steps[currentStep].image} 
                    alt={steps[currentStep].title}
                    className="h-48 w-48 object-contain"
                    onError={(e) => {
                      // Fallback if image doesn't exist
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                </div>
                
                <Dialog.Title className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  {steps[currentStep].title}
                </Dialog.Title>
                
                <Dialog.Description className="mb-6 text-gray-600 dark:text-gray-300">
                  {steps[currentStep].description}
                </Dialog.Description>
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className={`rounded px-4 py-2 ${
                    currentStep === 0
                      ? "cursor-not-allowed text-gray-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  Previous
                </button>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleSkip}
                    className="rounded px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Skip
                  </button>
                  
                  <button
                    onClick={handleNext}
                    className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90"
                  >
                    {currentStep === steps.length - 1 ? "Finish" : "Next"}
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
} 