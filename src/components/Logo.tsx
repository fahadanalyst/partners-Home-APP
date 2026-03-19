import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32, showText = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left Arm (Light Blue) */}
        <path
          d="M50 85C30 75 15 55 15 35C15 20 25 10 40 10C45 10 50 12 55 15"
          stroke="#4FC3F7"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="40" cy="10" r="6" fill="#4FC3F7" />

        {/* Right Arm (Green) */}
        <path
          d="M50 85C70 75 85 55 85 35C85 20 75 10 60 10C55 10 50 12 45 15"
          stroke="#00A651"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="60" cy="10" r="6" fill="#00A651" />

        {/* House (Dark Blue) */}
        <path
          d="M35 55L50 40L65 55V75H35V55Z"
          fill="#005696"
        />
        <path
          d="M30 55L50 35L70 55"
          stroke="#005696"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-[#005696] leading-tight italic whitespace-nowrap">Partners Home</span>
          <span className="text-[10px] text-[#666666] uppercase tracking-widest font-medium -mt-1 whitespace-nowrap">and Nursing Services</span>
        </div>
      )}
    </div>
  );
};
