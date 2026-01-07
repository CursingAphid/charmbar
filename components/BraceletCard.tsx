'use client';

import Image from 'next/image';
import { Bracelet } from '@/lib/db';
import Card from './ui/Card';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface BraceletCardProps {
  bracelet: Bracelet;
  isSelected: boolean;
  onSelect: () => void;
}

export default function BraceletCard({ bracelet, isSelected, onSelect }: BraceletCardProps) {
  return (
    <Card onClick={onSelect} hover className="relative">
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 z-10 bg-pink-500 text-white rounded-full p-1.5 shadow-lg"
        >
          <Check className="w-4 h-4" />
        </motion.div>
      )}
      
      <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
        <Image
          src={bracelet.image}
          alt={bracelet.name}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading="lazy"
        />
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-1">{bracelet.name}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{bracelet.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">{bracelet.material}</span>
            <span className="text-xs text-gray-500">{bracelet.color}</span>
          </div>
          <span className="text-lg font-bold bg-[linear-gradient(135deg,#4a3c00_0%,#8b6914_25%,#b8860b_50%,#8b6914_75%,#4a3c00_100%)] bg-clip-text text-transparent">€{bracelet.price.toFixed(2)}</span>
        </div>
      </div>
      
      {isSelected && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          className="overflow-hidden bg-pink-50 border-t border-pink-200"
        >
          <div className="p-3 text-center">
            <span className="text-sm font-medium text-pink-700">Selected</span>
          </div>
        </motion.div>
      )}
    </Card>
  );
}

