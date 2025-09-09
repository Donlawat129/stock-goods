export default function Hero() {
  return (
    <section className="relative min-h-[80vh] md:min-h-screen bg-sand-500">
      {/* background image ด้านขวา */}
      <img
        src="/hero.jpg" // หรือใช้ URL ของภาพ
        alt="Essential tees"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* overlay สีทรายทึบเล็กน้อยให้ mood ใกล้เคียง */}
      <div className="absolute inset-0 bg-sand-500/70" />

      {/* gradient ซ้าย->โปร่ง เพื่อให้อ่านข้อความชัด */}
      <div className="absolute inset-0 bg-gradient-to-r from-sand-500/90 via-sand-500/60 to-transparent" />

      {/* content */}
      <div className="relative z-10 container min-h-[80vh] md:min-h-screen flex items-center">
        <div className="max-w-md text-white">
          <h2 className="text-2xl md:text-3xl font-medium">
            New Essential Tees
          </h2>
          <a href="#" className="cta mt-3">
            Learn more <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      {/* ขอบมนของภาพรวม (เหมือนตัวอย่าง) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-white rounded-t-[12px]" />
    </section>
  );
}
