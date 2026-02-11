/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { DotsVerticalIcon } from '../icons';
import { SparklesCore } from './sparkles';

interface CompareProps {
  firstImage?: string;
  secondImage?: string;
  className?: string;
  firstImageClassName?: string;
  secondImageClassname?: string;
  initialSliderPercentage?: number;
  slideMode?: 'hover' | 'drag';
  showHandlebar?: boolean;
}

export const Compare = ({ firstImage = '', secondImage = '', className, firstImageClassName, secondImageClassname, initialSliderPercentage = 50, slideMode = 'hover', showHandlebar = true }: CompareProps) => {
  const [sliderXPercent, setSliderXPercent] = useState(initialSliderPercentage);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => setSliderXPercent(initialSliderPercentage), [initialSliderPercentage]);

  const handleMove = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    if (slideMode === 'hover' || (slideMode === 'drag' && isDragging)) {
      const rect = sliderRef.current.getBoundingClientRect();
      const percent = ((clientX - rect.left) / rect.width) * 100;
      setSliderXPercent(Math.max(0, Math.min(100, percent)));
    }
  }, [slideMode, isDragging]);

  return (
    <div ref={sliderRef} className={cn('w-[400px] h-[400px] overflow-hidden relative', className)} onMouseMove={(e) => handleMove(e.clientX)} onMouseDown={() => setIsDragging(true)} onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}>
      <AnimatePresence initial={false}>
        <motion.div className="h-full w-px absolute top-0 z-30 bg-gradient-to-b from-transparent via-indigo-500 to-transparent" style={{ left: `${sliderXPercent}%` }} transition={{ duration: 0 }}>
          <div className="w-10 h-3/4 top-1/2 -translate-y-1/2 absolute -right-10">
            <MemoizedSparklesCore background="transparent" minSize={0.4} maxSize={1} particleDensity={500} className="w-full h-full" particleColor="#FFFFFF" />
          </div>
          {showHandlebar && <div className="h-5 w-5 rounded-md top-1/2 -translate-y-1/2 bg-white -right-2.5 absolute flex items-center justify-center border border-gray-300/80"><DotsVerticalIcon className="h-4 w-4 text-black" /></div>}
        </motion.div>
      </AnimatePresence>
      <div className="overflow-hidden w-full h-full relative z-20 pointer-events-none">
        {firstImage && (
          <motion.div className={cn('absolute inset-0 rounded-2xl overflow-hidden', firstImageClassName)} style={{ clipPath: `inset(0 ${100 - sliderXPercent}% 0 0)` }} transition={{ duration: 0 }}>
            <img alt="first" src={firstImage} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          </motion.div>
        )}
      </div>
      {secondImage && <motion.img className={cn('absolute top-0 left-0 z-[19] rounded-2xl w-full h-full object-cover', secondImageClassname)} alt="second" src={secondImage} draggable={false} />}
    </div>
  );
};

const MemoizedSparklesCore = React.memo(SparklesCore);
