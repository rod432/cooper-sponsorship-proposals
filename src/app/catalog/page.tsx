"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import CategoriesSection from "@/components/catalog/categories-section";
import ProductsSection from "@/components/catalog/products-section";
import CustomisationSection from "@/components/catalog/customisation-section";

export default function CatalogPage() {
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, sort_order)")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Catalog
      </h1>

      <CategoriesSection
        categories={categories}
        products={products}
        isLoading={loadingCategories}
      />

      <ProductsSection
        categories={categories}
        products={products}
        isLoading={loadingProducts}
      />

      <CustomisationSection />
    </div>
  );
}
