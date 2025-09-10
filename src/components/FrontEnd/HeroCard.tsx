import React from 'react';

interface HeroCardProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  size: 'large' | 'small';
  linkUrl: string;
}

const HeroCard: React.FC<HeroCardProps> = ({ title, subtitle, imageUrl, size, linkUrl }) => {
  const isLarge = size === 'large';
  const cardClasses = `relative flex flex-col justify-end p-8 text-white bg-cover bg-center rounded-lg shadow-lg overflow-hidden transition-transform duration-300 transform hover:scale-105 ${isLarge ? 'md:row-span-2' : ''}`;

  return (
    
    <div className={cardClasses} style={{ backgroundImage: `url(${imageUrl})` }}>
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black opacity-30"></div>
      
      <div className="relative z-10">
        <h3 className="text-sm font-light uppercase tracking-widest">{subtitle}</h3>
        <h2 className={`font-bold mt-1 mb-4 ${isLarge ? 'text-2xl' : 'text-xl'}`}>{title}</h2>
        <a href={linkUrl}>
          <button className="bg-white text-black px-6 py-2 rounded-full font-semibold text-sm transition-colors duration-200 hover:bg-gray-200">
            Shop Now
          </button>
        </a>
      </div>
    </div>
  );
};

export default HeroCard;