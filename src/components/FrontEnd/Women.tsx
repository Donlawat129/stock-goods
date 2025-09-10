
import ProductCard from "./ProductCard";
import type { Product } from "./ProductCard"; 
import { useMemo, useState } from "react";
import CategoryProducts from "./CategoryProducts";

// const img = (id: number) =>
//   `https://images.unsplash.com/photo-1520975922474-8b456906c813?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=${id}`;

const ALL_PRODUCTS: Product[] = [
  // { id: "w1",  name: "Women’s Essential Tee", color: "(Rose)",          price: 30, image: img(101), stock: 12 },
  // { id: "w2",  name: "Women’s Essential Tee", color: "(Cream)",         price: 30, image: img(102), stock: 12 },
  // { id: "w3",  name: "Women’s Essential Tee", color: "(Charcoal)",      price: 30, image: img(103), stock: 12 },
  // { id: "w4",  name: "Women’s Essential Tee", color: "(Olive)",         price: 30, image: img(104), stock: 12 },
  // { id: "w5",  name: "Women’s Essential Tee", color: "(Lilac)",         price: 30, image: img(105), stock: 12 },
  // { id: "w6",  name: "Women’s Essential Tee", color: "(Deep Navy)",     price: 30, image: img(106), stock: 12 },
  // { id: "w7",  name: "Women’s Essential Tee", color: "(Sand)",          price: 30, image: img(107), stock: 12 },
  // { id: "w8",  name: "Women’s Essential Tee", color: "(Forest)",        price: 30, image: img(108), stock: 12 },
  // { id: "w9",  name: "Women’s Essential Tee", color: "(Clay)",          price: 30, image: img(109), stock: 12 },
  // { id: "w10", name: "Women’s Essential Tee", color: "(Heather Grey)",  price: 30, image: img(110), stock: 12 },
  // { id: "w11", name: "Women’s Essential Tee", color: "(Black)",         price: 30, image: img(111), stock: 12 },
  // { id: "w12", name: "Women’s Essential Tee", color: "(Bone)",          price: 30, image: img(112), stock: 12 },
];

export default function Women() {
  const [limit, setLimit] = useState(8);
  const products = useMemo(() => ALL_PRODUCTS.slice(0, limit), [limit]);
  const hasMore = limit < ALL_PRODUCTS.length;

  return (
    <div className="container mx-auto px-4 py-10">
      <CategoryProducts category="Womens" />;
      {/* Tabs */}
            <div className="mb-4 text-sm text-gray-600">
        Showing {products.length} products
      </div>

      {/* Grid */}
      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>

      {/* Load more */}
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
