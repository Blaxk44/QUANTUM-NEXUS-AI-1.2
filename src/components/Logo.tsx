import React, { useState } from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const sizes = {
    sm: { width: 24, height: 24, text: 'text-lg' },
    md: { width: 32, height: 32, text: 'text-2xl' },
    lg: { width: 48, height: 48, text: 'text-4xl' },
    xl: { width: 64, height: 64, text: 'text-6xl' },
  };

  const { width, height, text } = sizes[size];
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        {!imageError ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="relative z-10"
          >
            <img 
              src="https://i.ibb.co/99Jy5Mk4/logo.png" 
              alt="Nexus Logo" 
              width={width} 
              height={height} 
              className="object-contain"
              onError={(e) => {
                // Try the viewer URL as a fallback or just fail to SVG
                const target = e.target as HTMLImageElement;
                if (target.src === "https://i.ibb.co/99Jy5Mk4/logo.png") {
                   target.src = "https://ibb.co/99Jy5Mk4"; // This won't work for img src but just in case
                   setImageError(true);
                } else {
                   setImageError(true);
                }
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="relative z-10"
          >
            <svg
              width={width}
              height={height}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="50" cy="50" r="45" stroke="url(#paint0_linear)" strokeWidth="2" strokeDasharray="10 5" />
              <circle cx="50" cy="50" r="35" stroke="url(#paint1_linear)" strokeWidth="2" strokeDasharray="5 5" />
              <path d="M50 20V80M20 50H80" stroke="url(#paint2_linear)" strokeWidth="1" strokeOpacity="0.5" />
              <defs>
                <linearGradient id="paint0_linear" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00FF00" />
                  <stop offset="1" stopColor="#003300" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="paint1_linear" x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00FF00" />
                  <stop offset="1" stopColor="#003300" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="paint2_linear" x1="50" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00FF00" />
                  <stop offset="1" stopColor="#003300" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        )}
        
        {/* Central Core (only show if SVG fallback is active or image is transparent enough) */}
        {imageError && (
          <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-nexus-accent/20 rounded-full blur-sm animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-nexus-accent font-bold text-[10px]">N</div>
          </>
        )}
      </div>
      
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-tighter uppercase ${text}`}>
            NEXUS
          </span>
          <span className="text-[0.4em] uppercase tracking-[0.3em] text-nexus-accent font-bold">
            Quantum AI
          </span>
        </div>
      )}
    </div>
  );
};
