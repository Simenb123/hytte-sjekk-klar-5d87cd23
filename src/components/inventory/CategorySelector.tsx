import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, getCategorySubcategories } from '@/data/categories';

interface CategorySelectorProps {
  form: UseFormReturn<any>;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({ form }) => {
  const selectedCategory = form.watch('category');
  const subcategories = selectedCategory ? getCategorySubcategories(selectedCategory) : [];

  // Reset subcategory when category changes
  React.useEffect(() => {
    if (selectedCategory) {
      const currentSubcategory = form.getValues('subcategory');
      if (currentSubcategory && !subcategories.includes(currentSubcategory)) {
        form.setValue('subcategory', '');
      }
    } else {
      form.setValue('subcategory', '');
    }
  }, [selectedCategory, subcategories, form]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kategori</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.keys(CATEGORIES).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {subcategories.length > 0 && (
        <FormField
          control={form.control}
          name="subcategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Underkategori</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg underkategori" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ingen">Ingen underkategori</SelectItem>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};