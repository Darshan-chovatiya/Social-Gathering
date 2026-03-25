import React, { useState, useEffect } from 'react';
import { MapPin, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const InfiniteCarousel = ({ items, navigate }) => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const length = items?.length || 0;

  useEffect(() => {
    if (!items || length === 0) return;
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [items, length]);

  useEffect(() => {
    if (length === 0) return;

    if (currentIndex === length + 1) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(1);
      }, 500);
      return () => clearTimeout(timeout);
    } else if (currentIndex === 0) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(length);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, length]);

  if (!items || length === 0) return null;

  // Create clone nodes for infinite scrolling effect
  const displayList = [items[length - 1], ...items, items[0]];

  const getImageUrl = (path) => {
    if (!path) return '';
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  const nextSlide = (e) => {
    e?.stopPropagation();
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const prevSlide = (e) => {
    e?.stopPropagation();
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const taglines = {
    Event: 'Experience the Magic of Live Performance',
  }

  return (
    <div className="relative w-full h-[500px] sm:h-[500px] md:h-[500px] lg:h-[550px] xl:h-[670px] overflow-hidden bg-gray-950 group">
      {/* Slides Container */}
      <div
        className={`flex h-full ${isTransitioning ? 'transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1)' : ''}`}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {displayList.map((item, idx) => {
          if (!item) return null;
          const bgImg = getImageUrl(item.banner);
          const isActive = currentIndex === idx;

          return (
            <div
              key={`carousel-${item.id}-${idx}`}
              onClick={() => navigate(item.link)}
              className="w-full h-full shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer"
            >
              {/* Background Image with Zoom Animation */}
              <div className="absolute inset-0 z-0">
                <img
                  src={bgImg}
                  alt={item.title}
                  className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                />
                {/* Advanced Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
                <div className="absolute inset-0 bg-black/30" />
              </div>

              {/* Content Overlay - Centered Content */}
              <div className="relative z-10 w-full max-w-4xl px-6 text-center text-white space-y-4 md:space-y-8">
                {/* Decorative Header */}
                <div 
                  className={`flex items-center justify-center gap-4 transition-all duration-1000 delay-300 transform ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  <div className="h-[1px] w-8 md:w-16 bg-white/40" />
                  <span className="text-sm md:text-lg font-medium tracking-[0.3em] uppercase flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-400" />
                    {item.type === 'Event' ? 'Upcoming Event' : item.type}
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                  </span>
                  <div className="h-[1px] w-8 md:w-16 bg-white/40" />
                </div>

                {/* Main Title */}
                <h1 
                  className={`text-4xl md:text-5xl lg:text-6xl font-medium text-white dark:text-white uppercase tracking-tighter leading-[0.9] transition-all duration-1000 delay-500 transform ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                >
                  {item.title}
                </h1>

                {/* Description/Subtitle */}
                <div 
                  className={`space-y-4 transition-all duration-1000 delay-700 transform ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                >
                  <p className="text-sm md:text-xl text-gray-200 max-w-2xl mx-auto font-medium leading-relaxed">
                    {taglines[item.type] || 'Unfold your next perfect story with our premium selection of venues and events.'}
                  </p>
                  
                  <div className="flex items-center justify-center gap-2 text-primary-400 font-bold tracking-widest uppercase text-xs">
                    <MapPin className="w-4 h-4" />
                    <span>{item.location}</span>
                  </div>
                </div>

                {/* Call to Action Button */}
                <div 
                  className={`pt-6 transition-all duration-1000 delay-1000 transform ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                >
                  <button 
                    className="group/btn relative px-8 md:px-12 py-3 md:py-4 bg-white text-black font-black uppercase tracking-widest text-xs md:text-sm overflow-hidden transition-all hover:bg-primary-600 hover:text-white"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      View Details
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-all z-30 opacity-0 group-hover:opacity-100 hidden sm:flex"
      >
        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-all z-30 opacity-0 group-hover:opacity-100 hidden sm:flex"
      >
        <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
      </button>

      {/* Navigation Indicators */}
      <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex gap-3 z-30">
        {items.map((_, idx) => {
          let isActive = false;
          if (currentIndex === 0 && idx === length - 1) isActive = true;
          else if (currentIndex === length + 1 && idx === 0) isActive = true;
          else if (currentIndex - 1 === idx) isActive = true;

          return (
            <button
              key={`bullet-${idx}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsTransitioning(true);
                setCurrentIndex(idx + 1);
              }}
              className={`h-1 transition-all duration-500 rounded-full ${
                isActive ? 'w-12 bg-white' : 'w-4 bg-white/40 hover:bg-white/60'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default InfiniteCarousel;
