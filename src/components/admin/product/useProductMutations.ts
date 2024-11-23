import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types/schema";

export function useProductMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addProductMutation = useMutation({
    mutationFn: async (newProduct: Omit<Product, "id">) => {
      const { data, error } = await supabase
        .from("products")
        .insert([newProduct])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Product added",
        description: "The product has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (product: Product) => {
      const { data, error } = await supabase
        .from("products")
        .update({
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category_id: product.category_id,
        })
        .eq("id", product.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, delete all related order items
      const { error: orderItemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("product_id", id);

      if (orderItemsError) {
        console.error("Error deleting order items:", orderItemsError);
        throw orderItemsError;
      }

      // Then delete the product
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      
      return id;
    },
    onSuccess: (deletedId) => {
      // Immediately update the cache to remove the deleted product
      queryClient.setQueryData(["products"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((product: Product) => product.id !== deletedId);
      });
      
      // Then invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error in delete mutation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product. Please try again.",
      });
    },
  });

  return {
    addProductMutation,
    updateProductMutation,
    deleteProductMutation,
  };
}