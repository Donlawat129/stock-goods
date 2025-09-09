import { NavLink } from "react-router-dom";
import ProductCard from "./ProductCard";
import type { Product } from "./ProductCard"; 
import { useMemo, useState } from "react";

const img = (id: number) =>
  `https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=${id}`;

const ALL_PRODUCTS: Product[] = [
  { id: "o1",  name: "Geometric Tee",     color: "(Mono)",      price: 32, image: img(201) },
  { id: "o2",  name: "Minimal Circle Tee",color: "(Bone)",      price: 32, image: img(202) },
  { id: "o3",  name: "Lines Tee",         color: "(Graphite)",  price: 32, image: img(203) },
  { id: "o4",  name: "Triangle Tee",      color: "(Rust)",      price: 32, image: img(204) },
  { id: "o5",  name: "Dot Tee",           color: "(Black)",     price: 32, image: img(205) },
  { id: "o6",  name: "Wave Tee",          color: "(Indigo)",    price: 32, image: img(206) },
  { id: "o7",  name: "Grid Tee",          color: "(Charcoal)",  price: 32, image: img(207) },
  { id: "o8",  name: "Arc Tee",           color: "(Olive)",     price: 32, image: img(208) },
  { id: "o9",  name: "Blend Tee",         color: "(Sand)",      price: 32, image: img(209) },
  { id: "o10", name: "Stripe Tee",        color: "(Deep Navy)", price: 32, image: img(210) },
  { id: "o11", name: "Fade Tee",          color: "(Grey)",      price: 32, image: img(211) },
  { id: "o12", name: "Peak Tee",          color: "(Port)",      price: 32, image: img(212) },
];

export default function Objects() {
  const [limit, setLimit] = useState(8);
  const products = useMemo(() => ALL_PRODUCTS.slice(0, limit), [limit]);
  const hasMore = limit < ALL_PRODUCTS.length;

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Tabs */}
      <div className="mb-8 flex gap-8 text-sm">
        <NavLink to="/men" className="text-gray-500 hover:text-gray-900 pb-2">Mens</NavLink>
        <NavLink to="/women" className="text-gray-500 hover:text-gray-900 pb-2">Womens</NavLink>
        <NavLink
          to="/objects"
          className={({ isActive }) =>
            `pb-2 ${isActive ? "border-b-2 border-gray-900 text-gray-900" : "text-gray-500 hover:text-gray-900"}`
          }
        >
          Objects
        </NavLink>
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
