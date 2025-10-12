import React from 'react';
import Button from '../../../components/ui/button';

const DJCardNew = ({ dj, onViewDetails }) => {
  return (
    <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={dj?.profile_image_url || '/placeholder-dj.jpg'}
          alt={dj?.name}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-80 flex flex-col justify-end p-6">


        <div className="mt-2 flex items-center justify-between gap-[9px]">
          <h3 className="text-lg leading-6 font-semibold text-white drop-shadow-lg truncate flex-1 min-w-0" style={{ opacity: 0.62 }}>
            {dj?.name}
          </h3>
          <Button
            onClick={() => onViewDetails(dj)}
            variant="outline"
            className="ml-auto shrink-0 h-[30px] text-xs font-normal leading-[18px] bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm"
          >
            Ver detalhes
          </Button>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-blue-600/0 group-hover:from-purple-600/10 group-hover:to-blue-600/10 transition-all duration-300"></div>
    </div>
  );
};

export default DJCardNew;
