export type Product = {
  id: string;
  name: string;      // เช่น "Men’s Essential Tee"
  color: string;     // เช่น "(Port)"
  price: number;     // เช่น 30
  image: string;
    stock: number;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
   <div className="group">
      <div className="rounded bg-white border border-gray-200 overflow-hidden">
        <div className="aspect-[3/4] w-full bg-gray-50">
          <img
            src={product.image}
            alt={`${product.name} ${product.color}`}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>

      <div className="mt-3 text-sm leading-5">
        <div className="text-gray-900">
          {product.name} <span className="text-gray-400">{product.color}</span>
        </div>
        <div className="mt-1 font-medium text-gray-900">${product.price.toFixed(2)}</div>
        <div className="text-xs mt-1">
          {product.stock > 0 ? (
            <span className="text-green-600">In stock: {product.stock}</span>
          ) : (
            <span className="text-red-500">Sold out</span>
          )}
        </div>
      </div>
    </div>
  );
}
