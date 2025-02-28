import React, { useMemo } from 'react';
import { Category } from '@prisma/client';
import { TagIcon } from "@heroicons/react/24/outline";
import { TaskFormField } from './TaskFormField';
import { useTranslation } from '@/lib/i18n';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategories: string[];
  onChange: (categoryIds: string[]) => void;
  onBlur?: () => void;
  error?: string;
  onAddNew?: () => void;
  isAddingNew?: boolean;
  newCategoryName?: string;
  onNewCategoryNameChange?: (name: string) => void;
  newCategoryColor?: string;
  onNewCategoryColorChange?: (color: string) => void;
  onCreateCategory?: () => void;
  onCancelAddNew?: () => void;
  categoryError?: string;
}

export function CategorySelector({ 
  categories, 
  selectedCategories, 
  onChange,
  onBlur,
  error,
  onAddNew,
  isAddingNew,
  newCategoryName = "",
  onNewCategoryNameChange,
  newCategoryColor = "#3B82F6",
  onNewCategoryColorChange,
  onCreateCategory,
  onCancelAddNew,
  categoryError
}: CategorySelectorProps) {
  const { t } = useTranslation();
  
  const categoryIcon = useMemo(() => (
    <TagIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5" aria-hidden="true" />
  ), []);

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onChange([...selectedCategories, categoryId]);
    }
    if (onBlur) onBlur();
  };

  return (
    <TaskFormField
      id="categories-group"
      label="Categories"
      icon={categoryIcon}
      error={error}
    >
      <div 
        className="flex flex-wrap gap-2 mb-2"
        role="group"
        aria-labelledby="categories-group-label"
      >
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => toggleCategory(category.id)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 ${
              selectedCategories.includes(category.id)
                ? "shadow-sm border"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
            }`}
            style={{
              backgroundColor: selectedCategories.includes(category.id)
                ? `${category.color}25`
                : "",
              color: selectedCategories.includes(category.id)
                ? category.color
                : "",
              borderColor: selectedCategories.includes(category.id)
                ? category.color
                : "",
            }}
            aria-pressed={selectedCategories.includes(category.id)}
          >
            {category.name}
          </button>
        ))}
        
        {onAddNew && !isAddingNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:border-gray-600 transition-all duration-200"
          >
            + Add New
          </button>
        )}
      </div>
      
      {isAddingNew && (
        <div className="mt-3 p-3 border rounded-md bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Create New Category
          </h4>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="new-category-name" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                id="new-category-name"
                value={newCategoryName}
                onChange={(e) => onNewCategoryNameChange?.(e.target.value)}
                className="form-input py-1 text-sm w-full"
                placeholder="Enter category name"
              />
            </div>
            
            <div>
              <label htmlFor="new-category-color" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <input
                type="color"
                id="new-category-color"
                value={newCategoryColor}
                onChange={(e) => onNewCategoryColorChange?.(e.target.value)}
                className="form-input p-1 h-8 w-full"
              />
            </div>
            
            {categoryError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {categoryError}
              </p>
            )}
            
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={onCancelAddNew}
                className="px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onCreateCategory}
                className="px-2.5 py-1 rounded text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </TaskFormField>
  );
} 