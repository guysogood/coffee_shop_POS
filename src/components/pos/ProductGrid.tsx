import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock: number;
}

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  const { toast } = useToast();
  
  const { data: products, isLoading, error } = useQuery({
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

  if (isLoading) return <div className="text-center">Loading products...</div>;
  if (error) return <div className="text-center text-red-500">Error loading products</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products?.map((product) => (
        <Card key={product.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">{product.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
            {product.description && (
              <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
            )}
            <p className="text-sm mt-2">Stock: {product.stock}</p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => {
                if (product.stock > 0) {
                  onAddToCart(product);
                  toast({
                    title: "Added to cart",
                    description: `${product.name} added to cart`,
                  });
                } else {
                  toast({
                    variant: "destructive",
                    title: "Out of stock",
                    description: `${product.name} is currently out of stock`,
                  });
                }
              }}
              disabled={product.stock === 0}
            >
              Add to Cart
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}