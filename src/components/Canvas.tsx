/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcwIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import Spinner from './Spinner';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  isLoading: boolean;
  loadingMessage: string;
  onSelectPose: (index: number) => void;
  poseInstructions: string[];
  currentPoseIndex: number;
  availablePoseKeys: string[];
}

const Canvas: React.FC<CanvasProps> = ({ displayImageUrl, onStartOver, isLoading, loadingMessage, onSelectPose, poseInstructions, currentPoseIndex }) => {
  const [isPoseMenuOpen, setIsPoseMenuOpen] = useState(false);

  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative animate-zoom-in group">
      <button onClick={onStartOver} className="absolute top-4 left-4 z-30 flex items-center bg-white/60 border border-gray-300/80 text-gray-700 font-semibold py-2 px-4 rounded-full text-sm backdrop-blur-sm">
        <RotateCcwIcon className="w-4 h-4 mr-2" />Start Over
      </button>

      <div className="relative w-full h-full flex items-center justify-center">
        {displayImageUrl ? <img key={displayImageUrl} src={displayImageUrl} alt="Virtual try-on model" className="max-w-full max-h-full object-contain transition-opacity duration-500 animate-fade-in rounded-lg" /> : <div className="w-[400px] h-[600px] bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center"><Spinner /><p className="text-md font-serif text-gray-600 mt-4">Loading Model...</p></div>}
        <AnimatePresence>
          {isLoading && (
            <motion.div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Spinner />
              {loadingMessage && <p className="text-lg font-serif text-gray-700 mt-4 text-center px-4">{loadingMessage}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {displayImageUrl && !isLoading && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onMouseEnter={() => setIsPoseMenuOpen(true)} onMouseLeave={() => setIsPoseMenuOpen(false)}>
          <AnimatePresence>
            {isPoseMenuOpen && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-3 w-64 bg-white/80 backdrop-blur-lg rounded-xl p-2 border border-gray-200/80">
                <div className="grid grid-cols-2 gap-2">
                  {poseInstructions.map((pose, index) => (
                    <button key={pose} onClick={() => onSelectPose(index)} className="w-full text-left text-sm font-medium text-gray-800 p-2 rounded-md hover:bg-gray-200/70 disabled:opacity-50" disabled={index === currentPoseIndex}>{pose}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-center gap-2 bg-white/60 backdrop-blur-md rounded-full p-2 border border-gray-300/50">
            <button onClick={() => onSelectPose((currentPoseIndex - 1 + poseInstructions.length) % poseInstructions.length)} aria-label="Previous pose" className="p-2 rounded-full hover:bg-white/80"><ChevronLeftIcon className="w-5 h-5 text-gray-800" /></button>
            <span className="text-sm font-semibold text-gray-800 w-48 text-center truncate">{poseInstructions[currentPoseIndex]}</span>
            <button onClick={() => onSelectPose((currentPoseIndex + 1) % poseInstructions.length)} aria-label="Next pose" className="p-2 rounded-full hover:bg-white/80"><ChevronRightIcon className="w-5 h-5 text-gray-800" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
