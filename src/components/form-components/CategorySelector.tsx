import React, { useMemo } from 'react';
import { Category } from '@prisma/client';
import { TagIcon } from "@heroicons/react/24/outline";
import { TaskFormField } from './TaskFormField';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (categoryIds: string[]) => void;
}

export function CategorySelector({ 
  categories, 
  selectedCategories, 
  onCategoryChange 
}: CategorySelectorProps) {
  const categoryIcon = useMemo(() => (
    <TagIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5" aria-hidden="true" />
  ), []);

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  return (
    <TaskFormField
      id="categories-group"
      label="Categories"
      icon={categoryIcon}
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
      </div>
    </TaskFormField>
  );
} 