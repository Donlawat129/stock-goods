import Hero from './Hero'

import About from './About'

export default function Home() {
  return (
    <>
      <Hero />
      {/* ใส่ section อื่น ๆ ต่อได้ เช่นสินค้าแนะนำ ฯลฯ */}
  
         < About />
    </>
  );
}
