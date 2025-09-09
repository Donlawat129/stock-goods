export default function Hero() {
  return (
    <section className="relative min-h-[80vh] md:min-h-screen bg-sand-500 overflow-hidden">
      {/* background image ด้านขวา */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="https://cdn.pixabay.com/photo/2021/02/16/02/56/clothes-6019690_1280.jpg"
          alt="Essential tees"
          className="h-full w-full object-cover object-center scale-105 hover:scale-100 transition-transform duration-700"
        />
      </div>

      {/* overlay สีทรายทึบเล็กน้อยให้ mood ใกล้เคียง */}
      <div className="absolute inset-0 bg-sand-500/60" />

      {/* gradient ซ้าย->โปร่ง เพื่อให้อ่านข้อความชัด */}
      <div className="absolute inset-0 bg-gradient-to-r from-sand-600/80 via-sand-500/50 to-transparent" />

      {/* content */}
      <div className="relative z-10 container min-h-[80vh] md:min-h-screen flex items-center">
        <div className="max-w-md text-white space-y-4 animate-fade-in">
          <p className="text-sm md:text-base font-light tracking-widest uppercase opacity-90">
            Summer Collection 2023
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            New Essential <br />Tees
          </h1>
          <p className="text-lg md:text-xl opacity-95 font-light">
            Discover our premium collection of comfortable and sustainable t-shirts for everyday wear.
          </p>
          <div className="flex gap-4 mt-6">
            <a 
              href="#" 
              className="px-6 py-3 bg-white text-sand-700 font-medium rounded-full hover:bg-sand-100 transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
              Shop Now
            </a>
            <a 
              href="#" 
              className="px-6 py-3 border-2 border-white text-white font-medium rounded-full hover:bg-white/10 transition-colors duration-300"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>

      {/* Indicator สำหรับ scroll */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 hidden md:block">
        <div className="animate-bounce w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
        </div>
      </div>

      {/* ขอบมนของภาพรวม (เหมือนตัวอย่าง) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-white rounded-t-[24px] md:rounded-t-[32px]" />
    </section>
  );
}