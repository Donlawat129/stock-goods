export type Product = {
  id: string;
  name: string;      // เช่น "Men’s Essential Tee"
  color: string;     // เช่น "(Port)"
  price: number;     // เช่น 30
  image: string;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group">
      <div className="aspect-[3/4] w-full overflow-hidden rounded bg-gray-100">
        <img
          src={product.image}
          alt={`${product.name} ${product.color}`}
          className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div className="mt-3 text-sm">
        <div className="text-gray-900">{product.name}</div>
        <div className="text-gray-500">{product.color}</div>
        <div className="mt-1 font-medium text-gray-900">
          ${product.price.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
