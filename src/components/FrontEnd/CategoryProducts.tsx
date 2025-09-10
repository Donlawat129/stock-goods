// src/components/CategoryProducts.tsx
import { useEffect, useState } from "react";
import { getProducts} from "../../lib/sheetsClient";
import type { ProductRow } from "../../lib/sheetsClient"
import ProductCard from "./ProductCard";

interface Props {
  category: string; // "Mens", "Womens", "Objects"
}

export default function CategoryProducts({ category }: Props) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [limit, setLimit] = useState(8);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { items } = await getProducts();
        // filter ตาม category
        const filtered = items.filter(p => p.category === category);
        setProducts(filtered);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category]);

  const visibleProducts = products.slice(0, limit);
  const hasMore = limit < products.length;

  if (loading) return <p>Loading...</p>;
  if (products.length === 0) return <p>No products found in {category}</p>;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-4 text-sm text-gray-600">
        Showing {visibleProducts.length} of {products.length} products
      </div>

      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleProducts.map(p => (
          <ProductCard key={p.id} product={{
            id: p.id,
            name: p.name,
            image: p.imageUrl,
            price: Number(p.price),
            stock: Number(p.quantity),
            color: p.category,
          }} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setLimit(n => n + 8)}
            className="rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
