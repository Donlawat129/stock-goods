// src/components/Hero.tsx (หรือ HeroCarousel.tsx)
import { useEffect, useState } from "react";
import {
  // ถ้ามี lib/sheetsClient ใช้โหมดดึงตรงจากชีตได้
  getHeroBanners,
  getHeroIntervalMs,
  type BannerRow,
} from "../../lib/sheetsClient"; // ปรับ path ให้ตรงโปรเจคคุณ

type Slide = {
  title: string;
  subtitle: string;
  desc: string;
  image: string;
  overlayHex?: string;     // สี overlay จากชีต (hex) เช่น #1a237e
  buttonHex?: string;      // สีปุ่มจากชีต (hex)
};

const FALLBACK_SLIDES: Slide[] = [
  {
    title: "New Essential Tees",
    subtitle: "Summer Collection 2023",
    desc: "Discover our premium collection of comfortable and sustainable t-shirts for everyday wear.",
    image: "https://cdn.pixabay.com/photo/2021/02/16/02/56/clothes-6019690_1280.jpg",
    overlayHex: "#1e3a8a",
    buttonHex: "#2563eb",
  },
  {
    title: "Stylish Jackets",
    subtitle: "Autumn Collection 2023",
    desc: "Stay warm and fashionable with our latest sustainable outerwear.",
    image: "https://cdn.pixabay.com/photo/2016/11/19/15/40/clothes-1839935_1280.jpg",
    overlayHex: "#92400e",
    buttonHex: "#d97706",
  },
  {
    title: "Eco-friendly Denim",
    subtitle: "Winter Collection 2023",
    desc: "Premium denim designed for comfort and sustainability.",
    image: "https://cdn.pixabay.com/photo/2021/11/15/05/25/boutique-6796399_1280.jpg",
    overlayHex: "#312e81",
    buttonHex: "#4f46e5",
  },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL; // เช่น https://yourdomain.com/api

export default function HeroCarousel() {
  const [slides, setSlides] = useState<Slide[]>(FALLBACK_SLIDES);
  const [intervalMs, setIntervalMs] = useState<number>(5000);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // โหลดข้อมูล: API -> Sheets -> Fallback
  useEffect(() => {
    (async () => {
      // 1) ลองดึงจาก Public API ก่อน
      if (API_BASE) {
        try {
          const res = await fetch(`${API_BASE.replace(/\/$/, "")}/hero`, { cache: "no-store" });
          if (res.ok) {
            const data: { intervalMs: number; items: BannerRow[] } = await res.json();
            const mapped = mapToSlides(data.items);
            if (mapped.length) {
              setSlides(mapped);
              setIntervalMs(safeInterval(data.intervalMs));
              return;
            }
          }
        } catch {
          // เงียบไว้แล้วลองโหมดถัดไป
        }
      }

      // 2) ถ้าไม่มี API / ดึงไม่สำเร็จ → ลองอ่านตรงจากชีต (ต้องมี token มาก่อน)
      try {
        const [{ items }, ms] = await Promise.all([getHeroBanners(), getHeroIntervalMs()]);
        const mapped = mapToSlides(items);
        if (mapped.length) {
          setSlides(mapped);
          setIntervalMs(safeInterval(ms));
          return;
        }
      } catch {
        // ถ้าไม่ได้ก็ปล่อยให้ใช้ FALLBACK_SLIDES
      }
    })();
  }, []);

  // autoplay ตาม intervalMs (จากหลังบ้าน)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isTransitioning && slides.length > 0) {
        setIsTransitioning(true);
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setTimeout(() => setIsTransitioning(false), 800);
      }
    }, Math.max(0, intervalMs || 0));

    return () => clearInterval(timer);
  }, [intervalMs, slides.length, isTransitioning]);

  const goToSlide = (index: number) => {
    if (index === currentSlide || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const goToNextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  // Swipe (mobile)
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchEnd, setTouchEnd] = useState<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove  = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd   = () => {
    if (touchStart - touchEnd > 50) goToNextSlide();
    else if (touchEnd - touchStart > 50) goToSlide((currentSlide - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative min-h-[70vh] overflow-hidden">
      <div
        className="relative h-[70vh] w-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides */}
        <div className="relative h-full w-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {/* Background Image */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className={`w-full h-full object-cover object-center transition-transform duration-10000 ease-out ${
                    index === currentSlide ? "scale-100" : "scale-110"
                  }`}
                />
              </div>

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />

              {/* Color overlay จาก hex (ซ้าย -> โปร่งใส) */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right, ${hexA(slide.overlayHex || "#000000", 0.7)}, ${hexA(
                    slide.overlayHex || "#000000",
                    0.4
                  )}, rgba(0,0,0,0))`,
                }}
              />

              {/* Content */}
              <div className="relative z-10 h-full flex items-center justify-center px-4">
                <div
                  className={`text-white text-center space-y-3 transition-all duration-700 transform ${
                    index === currentSlide ? "translate-y-0 opacity-100 delay-300" : "translate-y-10 opacity-0"
                  }`}
                >
                  <p className="text-xs font-light tracking-widest uppercase opacity-90">{slide.subtitle}</p>
                  <h1 className="text-2xl font-bold leading-tight px-2">{slide.title}</h1>
                  <p className="text-sm opacity-95 font-light max-w-xs mx-auto leading-relaxed">{slide.desc}</p>

                  {/* ตัวอย่างปุ่ม: คุณจะเปิดใช้ก็ได้ */}
                  {/* <a
                    href="#"
                    className="px-5 py-2 text-white font-medium rounded-full transition-all duration-300 shadow-lg text-sm min-w-[120px] text-center"
                    style={{ backgroundColor: slide.buttonHex || "#4f46e5" }}
                  >
                    Shop Now
                  </a> */}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? "bg-white w-6" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Arrows */}
        <button
          onClick={() => goToSlide((currentSlide - 1 + slides.length) % slides.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Rounded bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-white rounded-t-[20px]" />
      </div>
    </section>
  );

  function goToNext() {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 800);
  }
}

/* ---------------- helpers ---------------- */
function mapToSlides(rows: BannerRow[]): Slide[] {
  // BannerRow จากหลังบ้าน (schema ใหม่): title, subtitle, desc, image, color, buttonColor
  return rows
    .filter((r) => (r.title || r.subtitle || r.image)?.toString().trim())
    .map((r) => ({
      title: r.title || "",
      subtitle: r.subtitle || "",
      desc: r.desc || r.subtitle || "",
      image: r.image || "",
      overlayHex: (r.color || "").startsWith("#") ? r.color : "#000000",
      buttonHex: (r.buttonColor || "").startsWith("#") ? r.buttonColor : "#4f46e5",
    }));
}

function safeInterval(n: unknown) {
  const v = Number(n);
  return Number.isFinite(v) && v >= 0 ? v : 5000;
}

function hexA(hex: string, alpha = 1) {
  // #RRGGBB -> rgba(r,g,b,a)
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!m) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
