import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string | null;
}

export function CheckoutPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { error } = await supabase
        .from("products")
        .update({ stock })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Stock Updated",
        description: "Product stock has been updated successfully.",
      });
      setQuantities({});
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const currentQty = prev[productId] || 0;
      const product = products?.find((p) => p.id === productId);
      
      if (!product) return prev;
      
      const newQty = currentQty + delta;
      if (newQty < 0) return prev;
      
      if (delta > 0 && product.stock < newQty) {
        toast({
          variant: "destructive",
          title: "Not enough stock",
          description: `Only ${product.stock} items available`,
        });
        return prev;
      }
      
      return { ...prev, [productId]: newQty };
    });
  };

  const handleUpdateStock = async (product: Product) => {
    const quantity = quantities[product.id] || 0;
    if (quantity === 0) return;

    const newStock = product.stock + quantity;
    if (newStock < 0) {
      toast({
        variant: "destructive",
        title: "Invalid quantity",
        description: "Cannot reduce stock below 0",
      });
      return;
    }

    updateStockMutation.mutate({ id: product.id, stock: newStock });
  };

  if (isLoading) return <div>Loading products...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Stock Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products?.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Current Stock: {product.stock}</span>
                  <span>Price: ${product.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(product.id, -1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center">
                    {quantities[product.id] || 0}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(product.id, 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => handleUpdateStock(product)}
                  disabled={!quantities[product.id]}
                >
                  Update Stock
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}