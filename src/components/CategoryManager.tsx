import { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Category } from '@prisma/client';
import { useStore } from '@/lib/store';

interface CategoryManagerProps {
  selectedCategories: string[];
  onChange: (categoryIds: string[]) => void;
}

export function CategoryManager({ selectedCategories, onChange }: CategoryManagerProps) {
  const { categories } = useStore();
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    // Fetch all categories if not available in store
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setAvailableCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    if (categories.length === 0) {
      fetchCategories();
    } else {
      setAvailableCategories(categories);
    }
  }, [categories]);

  const handleCategorySelect = (categoryId: string) => {
    const newSelectedCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    onChange(newSelectedCategories);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setAvailableCategories(prev => [...prev, newCategory]);
        onChange([...selectedCategories, newCategory.id]);
        setNewCategoryName('');
        setIsAddingCategory(false);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Categories</h3>
        {!isAddingCategory && (
          <button
            type="button"
            onClick={() => setIsAddingCategory(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Add Category
          </button>
        )}
      </div>

      {/* Category List */}
      <div className="flex flex-wrap gap-2">
        {availableCategories.map(category => (
          <button
            key={category.id}
            type="button"
            onClick={() => handleCategorySelect(category.id)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedCategories.includes(category.id)
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Add Category Form */}
      {isAddingCategory && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            className="flex-1 border rounded-md px-3 py-1.5 text-sm"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateCategory}
            className="bg-blue-600 text-white rounded-md px-3 py-1.5 text-sm hover:bg-blue-700"
            disabled={!newCategoryName.trim()}
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAddingCategory(false);
              setNewCategoryName('');
            }}
            className="bg-gray-200 text-gray-600 rounded-md px-2 py-1.5 text-sm hover:bg-gray-300"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
} 