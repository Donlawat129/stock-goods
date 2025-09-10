import React from "react";
import HeroCard from "./HeroCard";

const App: React.FC = () => {
  return (
    <div className="container mx-auto p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 grid-rows-4 md:grid-rows-2 min-h-screen">
      {/* 1. Mens */}
      <HeroCard
        title="Ethereal Elegance (ความสง่างามเหนือระดับ)"
        subtitle="คอลเลกชันที่ผสานความคลาสสิกเข้ากับความทันสมัย เพื่อลุคที่ดูดีในทุกโอกาส"
        imageUrl="https://cdn.pixabay.com/photo/2017/05/25/21/26/young-2344413_1280.jpg"
        size="large"
        linkUrl="/men"
      />

      {/* 2. Womens */}
      <HeroCard
        title="Radiant Reverie (ความฝันที่เปล่งประกาย)"
        subtitle="พบกับชุดที่จะทำให้คุณรู้สึกโดดเด่นและเป็นตัวเองในแบบที่ไม่เคยมีมาก่อน"
        imageUrl="https://cdn.pixabay.com/photo/2015/12/04/07/48/doll-1076189_1280.jpg"
        size="small"
        linkUrl="/women"
      />

      {/* 3. Objects (Accessories) */}
      <HeroCard
        title="Urban Strides (ก้าวเดินในเมือง)"
        subtitle="เครื่องประดับและของตกแต่งที่ช่วยเติมเต็มสไตล์ และสะท้อนความเป็นคุณในทุกรายละเอียด"
        imageUrl="https://cdn.pixabay.com/photo/2015/12/04/07/48/doll-1076186_1280.jpg"
        size="small"
        linkUrl="/objects"
      />
    </div>
  );
};

export default App;
