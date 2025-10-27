import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface VinylRecordProps {
  isPlaying?: boolean;
  logoSrc?: string;
  className?: string;
  size?: number;
}

const grooveOffsets = [10, 18, 26, 34, 42];

const VinylRecord = ({
  isPlaying = false,
  logoSrc = '/logo.png',
  className,
  size = 320,
}: VinylRecordProps) => {
  return (
    <motion.div
      className={cn('relative overflow-visible', className)}
      style={{ width: size, height: size }}
      animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
      transition={
        isPlaying
          ? { repeat: Infinity, repeatType: 'loop', duration: 12, ease: 'linear' }
          : { duration: 0.6, ease: 'easeOut' }
      }
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]">
        <div className="absolute inset-[4%] rounded-full bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900" />
        {grooveOffsets.map((offset) => (
          <div
            key={offset}
            className="absolute rounded-full border border-white/5"
            style={{ inset: `${offset}%` }}
          />
        ))}

        <div className="absolute inset-[28%] rounded-full bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <img
            src={logoSrc}
            alt="Logo"
            className="relative w-full h-full object-contain p-6"
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="absolute inset-[47%] rounded-full bg-black/80 border border-black/60" />
      </div>

      <div className="absolute -top-6 -left-4 w-20 h-20 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute -bottom-8 right-6 w-24 h-24 rounded-full bg-purple-500/10 blur-3xl" />
    </motion.div>
  );
};

export default VinylRecord;
