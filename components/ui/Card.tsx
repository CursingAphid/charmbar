import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  hover?: boolean;
}

export default function Card({ 
  children, 
  className = '', 
  onClick, 
  onMouseEnter,
  onMouseLeave,
  hover = false 
}: CardProps) {
  const baseStyles = 'bg-white rounded-xl shadow-md overflow-hidden';
  // Keep hover stable (no shadow/transform changes) to avoid any perceived "movement"
  const interactiveStyles = onClick || hover ? 'cursor-pointer' : '';
  
  const Component = onClick ? motion.div : 'div';
  const motionProps = onClick ? {
    whileTap: { scale: 0.98 },
    transition: { duration: 0.2 },
  } : {};
  
  return (
    <Component
      {...(motionProps as any)}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`${baseStyles} ${interactiveStyles} ${className}`}
    >
      {children}
    </Component>
  );
}

