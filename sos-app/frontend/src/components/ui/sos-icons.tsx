// SOS Children's Villages Brand Icons
// Using official color palette: Primary Blue (#00abec) and Red (#de5a6c)

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Family Icon - Represents motherhood, fatherhood, parenthood
 */
export const FamilyIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = '#00abec' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    className={className}
    fill={color}
  >
    <circle cx="32" cy="10" r="5" />
    <path d="M32 18c-8 0-14 6-14 14v10c0 2 2 4 4 4h2v12h4v-12h4v12h4v-12h2c2 0 4-2 4-4V32c0-8-6-14-14-14z" />
  </svg>
);

/**
 * Children Icon - Represents children in care
 */
export const ChildrenIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = '#00abec' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    className={className}
    fill={color}
  >
    <circle cx="32" cy="12" r="4" />
    <path d="M32 18c-6 0-10 4-10 10v8c0 1.5 1 3 2 3h1v8h2v-8h2v8h2v-8h1c1 0 2-1.5 2-3v-8c0-6-4-10-10-10z" />
  </svg>
);

/**
 * Home Icon - Represents village/home
 */
export const HomeIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = '#00abec' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    className={className}
    fill={color}
  >
    <path d="M32 8L8 28v28h16v-12h16v12h16V28L32 8z" />
    <path d="M28 38h8v8h-8v-8z" fill="white" />
  </svg>
);

/**
 * Care Icon - Represents care and support
 */
export const CareIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = '#00abec' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    className={className}
    fill={color}
  >
    <circle cx="32" cy="14" r="5" />
    <path d="M32 22c-5 0-9 4-9 9v14h18V31c0-5-4-9-9-9z" />
    <path d="M20 48h24M18 52h28" stroke={color} strokeWidth="2" fill="none" />
  </svg>
);

/**
 * Protection/Help Icon - Represents protection and safety
 */
export const ProtectionIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = '#de5a6c' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    className={className}
    fill={color}
  >
    <path d="M32 6L12 16v16c0 12 20 24 20 24s20-12 20-24V16L32 6z" />
    <path d="M30 36v-6h4v6M32 26a2 2 0 110-4 2 2 0 010 4z" fill="white" />
  </svg>
);

/**
 * Heart Icon - Represents compassion and love
 */
export const HeartIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = '#de5a6c' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    className={className}
    fill={color}
  >
    <path d="M32 54C8 40 4 28 4 20c0-7 5-12 10-12 4 0 8 2 10 5 2-3 6-5 10-5 5 0 10 5 10 12 0 8-4 20-28 34z" />
  </svg>
);

/**
 * Education Icon - Represents learning
 */
export const EducationIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = '#00abec' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    className={className}
    fill={color}
  >
    <path d="M8 22L32 12L56 22V32H8V22Z" />
    <rect x="12" y="32" width="40" height="20" rx="2" />
    <line x1="32" y1="32" x2="32" y2="52" stroke={color} strokeWidth="2" />
    <line x1="16" y1="42" x2="48" y2="42" stroke={color} strokeWidth="2" />
  </svg>
);

/**
 * Support/Hands Icon - Represents mutual support
 */
export const SupportIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = '#00abec' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    className={className}
    fill={color}
  >
    <path d="M14 24C10 28 8 34 8 40c0 8 6 14 14 14 4 0 8-2 10-5M50 24c4 4 6 10 6 16 0 8-6 14-14 14-4 0-8-2-10-5" />
    <path d="M32 20c-2 0-4 2-4 4v20c0 2 2 4 4 4s4-2 4-4V24c0-2-2-4-4-4z" />
  </svg>
);

/**
 * World Icon - Represents global reach and cultural diversity
 */
export const WorldIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = '#00abec' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    className={className}
    fill={color}
  >
    <circle cx="32" cy="32" r="24" />
    <circle cx="32" cy="32" r="24" fill="none" stroke={color} strokeWidth="2" />
    <path d="M32 8V56M8 32H56" stroke={color} strokeWidth="2" />
    <ellipse cx="32" cy="32" rx="24" ry="8" fill="none" stroke={color} strokeWidth="1" />
  </svg>
);

/**
 * Alert/Urgent Icon - Represents urgent situations
 */
export const AlertIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = '#de5a6c' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    className={className}
    fill={color}
  >
    <path d="M32 4L6 52H58L32 4Z" />
    <circle cx="32" cy="42" r="2" fill="white" />
    <rect x="30" y="24" width="4" height="12" fill="white" />
  </svg>
);

/**
 * Progress/Success Icon - Represents progress and achievement
 */
export const ProgressIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = '#00abec' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    className={className}
    fill={color}
  >
    <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="4" />
    <path d="M24 32L30 38L44 24" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);
