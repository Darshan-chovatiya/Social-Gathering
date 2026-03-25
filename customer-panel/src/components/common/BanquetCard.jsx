import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Star, Users } from 'lucide-react';

const BanquetCard = ({ banquet }) => {
  const navigate = useNavigate();

  const getImageUrl = (path) => {
    if (!path) return '';
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  const maxCapacity = Math.max(...(banquet.venues?.map(v => v.floatingCapacity) || [0]), 0);

  return (
    <div
      onClick={() => navigate(`/banquets/${banquet._id}`)}
      className="group cursor-pointer flex flex-col bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 h-full hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-500"
    >
      {/* Image Section */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 dark:bg-gray-900 shrink-0 mx-3 mt-3 rounded-2xl">
        {banquet.banners?.[0] ? (
          <img
            src={getImageUrl(banquet.banners[0])}
            alt={banquet.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-12 h-12 text-gray-200 dark:text-gray-800" />
          </div>
        )}
        
        {/* Rating Tag */}
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/20">
          <Star className="w-3.5 h-3.5 text-primary-400 fill-primary-400" />
          <span className="text-xs font-bold text-white">4.9</span>
        </div>

        {/* Categories / Tag */}
        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm">
          <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-wider">Grand Venue</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-black text-gray-900 dark:text-white line-clamp-1 leading-tight tracking-tight uppercase mb-2">
          {banquet.title}
        </h3>

        <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-tight mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary-600" />
            <span className="truncate">{banquet.address?.city}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {maxCapacity} Max
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {banquet.venues?.length || 0} Venues
            </span>
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
          <div className="px-3 py-1 bg-primary-50 dark:bg-primary-900/40 border border-primary-100 dark:border-primary-800 rounded-full">
            <p className="text-[11px] font-black text-primary-700 dark:text-primary-300 text-nowrap">
              Premium <span className="font-bold opacity-70">Experience</span>
            </p>
          </div>
          <button className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest group-hover:underline">
             Check Availability
          </button>
        </div>
      </div>
    </div>
  );
};

export default BanquetCard;
