import { useState, useEffect } from "react";

const slides = [
  {
    title: "New Essential Tees",
    subtitle: "Summer Collection 2023",
    desc: "Discover our premium collection of comfortable and sustainable t-shirts for everyday wear.",
    image: "https://cdn.pixabay.com/photo/2021/02/16/02/56/clothes-6019690_1280.jpg",
    color: "from-blue-900/70",
    buttonColor: "bg-blue-600 hover:bg-blue-700"
  },
  {
    title: "Stylish Jackets",
    subtitle: "Autumn Collection 2023",
    desc: "Stay warm and fashionable with our latest sustainable outerwear.",
    image: "https://cdn.pixabay.com/photo/2016/11/19/15/40/clothes-1839935_1280.jpg",
    color: "from-amber-900/70",
    buttonColor: "bg-amber-600 hover:bg-amber-700"
  },
  {
    title: "Eco-friendly Denim",
    subtitle: "Winter Collection 2023",
    desc: "Premium denim designed for comfort and sustainability.",
    image: "https://cdn.pixabay.com/photo/2021/11/15/05/25/boutique-6796399_1280.jpg",
    color: "from-indigo-900/70",
    buttonColor: "bg-indigo-600 hover:bg-indigo-700"
  },
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      goToNextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlide]);

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

  // Swipe handling for mobile
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchEnd, setTouchEnd] = useState<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      // Swipe left - next slide
      goToNextSlide();
    } else if (touchEnd - touchStart > 50) {
      // Swipe right - previous slide
      goToSlide((currentSlide - 1 + slides.length) % slides.length);
    }
  };

  return (
    <section className="relative min-h-[70vh] bg-sand-500 overflow-hidden">
      <div 
        className="relative h-[70vh] w-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides Container */}
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
              
              {/* Overlay Gradients */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} via-sand-600/50 to-transparent`} />

              {/* Content for Mobile */}
              <div className="relative z-10 h-full flex items-center justify-center px-4">
                <div className={`text-white text-center space-y-3 transition-all duration-700 transform ${
                  index === currentSlide 
                    ? "translate-y-0 opacity-100 delay-300" 
                    : "translate-y-10 opacity-0"
                }`}>
                  <p className="text-xs font-light tracking-widest uppercase opacity-90">
                    {slide.subtitle}
                  </p>
                  <h1 className="text-2xl font-bold leading-tight px-2">
                    {slide.title}
                  </h1>
                  <p className="text-sm opacity-95 font-light max-w-xs mx-auto leading-relaxed">
                    {slide.desc}
                  </p>
                  <div className="flex flex-col gap-3 mt-4 items-center">
                    {/* <a
                      href="#"
                      className={`px-5 py-2 ${slide.buttonColor} text-white font-medium rounded-full transition-all duration-300 shadow-lg text-sm min-w-[120px] text-center`}
                    >
                      Shop Now
                    </a>
                    <a
                      href="#"
                      className="px-5 py-2 border border-white text-white font-medium rounded-full hover:bg-white/20 transition-all duration-300 text-sm min-w-[120px] text-center"
                    >
                      Learn More
                    </a> */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Dots - Mobile optimized */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index: number) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? "bg-white w-6" 
                  : "bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>



        {/* Navigation Arrows - Hidden on mobile, shown on tablet+ */}
    <button
    onClick={() => goToSlide((currentSlide - 1 + slides.length) % slides.length)}
    className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
    aria-label="Previous slide"
  >
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>

  <button
    onClick={goToNextSlide}
    className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
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
}