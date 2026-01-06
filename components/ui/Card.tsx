import { ReactNode, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(function Card({
  children,
  className = '',
  onClick,
  onMouseEnter,
  onMouseLeave,
  hover = false
}, ref) {
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
      ref={ref}
      {...(motionProps as any)}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`${baseStyles} ${interactiveStyles} ${className}`}
    >
      {children}
    </Component>
  );
});

Card.displayName = 'Card';

export default Card;

