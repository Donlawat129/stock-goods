import ProductCard from "./ProductCard";
// import { NavLink } from "react-router-dom";

type P = {
  id: string; name: string; color: string; price: number; image: string; stock: number; 
};

// รูปตัวอย่างจาก Unsplash (แทนด้วยรูปจริงทีหลังได้)
const IMG = (seed: string) =>
  `https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=${seed}`;

const products: P[] = [
  { id: "1", name: "Men’s Essential Tee", color: "(Port)", price: 30, image: IMG("1"), stock: 12 },
  { id: "2", name: "Men’s Essential Tee", color: "(Deep Forest)", price: 30, image: IMG("2"), stock: 12 },
  { id: "3", name: "Men’s Essential Tee", color: "(Bone)", price: 30, image: IMG("3"), stock: 12 },
  { id: "4", name: "Men’s Essential Tee", color: "(Charcoal)", price: 30, image: IMG("4"), stock: 12 },
  { id: "5", name: "Men’s Essential Tee", color: "(Washed Indigo)", price: 30, image: IMG("5"), stock: 12 },
  { id: "6", name: "Men’s Essential Tee", color: "(Black)", price: 30, image: IMG("6"), stock: 12 },
  { id: "7", name: "Men’s Essential Tee", color: "(Heather Grey)", price: 30, image: IMG("7"), stock: 12 },
  { id: "8", name: "Men’s Essential Tee", color: "(Olive)", price: 30, image: IMG("8"), stock: 12 },
  { id: "9", name: "Men’s Essential Tee", color: "(Charcoal)", price: 30, image: IMG("9"), stock: 12 },
  { id: "10", name: "Men’s Essential Tee", color: "(Bone)", price: 30, image: IMG("10"), stock: 12 },
  { id: "11", name: "Men’s Essential Tee", color: "(Graphite)", price: 30, image: IMG("11"), stock: 12 },
  { id: "12", name: "Men’s Essential Tee", color: "(Rust)", price: 30, image: IMG("12"), stock: 12 },
];

export default function Men() {
  return (
<div className="container mx-auto px-4 py-8">
      {/* Tabs */}
      {/* <div className="mb-8 flex gap-8 text-sm">
        <NavLink to="/men" className={({isActive}) =>
          `pb-2 ${isActive ? "border-b-2 border-gray-900 text-gray-900" : "text-gray-500 hover:text-gray-900"}`
        }>Mens</NavLink>
        <NavLink to="/women" className="text-gray-500 hover:text-gray-900 pb-2">Womens</NavLink>
        <NavLink to="/objects" className="text-gray-500 hover:text-gray-900 pb-2">Objects</NavLink>
      </div> */}

      {/* Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {products.length} products
      </div>

      {/* Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
