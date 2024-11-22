import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Coffee, Cookie, Croissant, CupSoda, Candy, Pizza } from "lucide-react";

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

const getProductIcon = (name: string) => {
  const iconProps = { className: "w-8 h-8 mb-2" };
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("americano") || lowerName.includes("coffee")) return <Coffee {...iconProps} />;
  if (lowerName.includes("cookie")) return <Cookie {...iconProps} />;
  if (lowerName.includes("croissant")) return <Croissant {...iconProps} />;
  if (lowerName.includes("cappuccino")) return <CupSoda {...iconProps} />;
  if (lowerName.includes("bagel")) return <Pizza {...iconProps} />; 
  if (lowerName.includes("muffin")) return <Candy {...iconProps} />;
  
  return <Coffee {...iconProps} />; // Default icon
};

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: products, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      
      if (error) throw error;
      // Remove duplicates based on product name
      const uniqueProducts = data.reduce((acc: Product[], current) => {
        const exists = acc.find(item => item.name === current.name);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      return uniqueProducts as Product[];
    },
  });

  const handleAddToCart = async (product: Product) => {
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
  };

  if (isLoading) return <div className="text-center">Loading products...</div>;
  if (error) return <div className="text-center text-red-500">Error loading products</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products?.map((product) => (
        <Card key={product.id} className="flex flex-col hover:shadow-lg transition-shadow">
          <CardHeader className="text-center pb-2">
            {getProductIcon(product.name)}
            <CardTitle className="text-lg">{product.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-2xl font-bold text-center text-primary">${product.price.toFixed(2)}</p>
            {product.description && (
              <p className="text-sm text-muted-foreground mt-2 text-center">{product.description}</p>
            )}
            <p className="text-sm mt-2 text-center">Stock: {product.stock}</p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => handleAddToCart(product)}
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