/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import WardrobePanel from './components/WardrobePanel';
import OutfitStack from './components/OutfitStack';
import { generatePoseVariation, generateVirtualTryOnImage } from './services/geminiService';
import type { OutfitLayer, WardrobeItem } from './types';
import { ChevronDownIcon, ChevronUpIcon } from './components/icons';
import { defaultWardrobe } from './wardrobe';
import Footer from './components/Footer';
import { getFriendlyErrorMessage } from './lib/utils';
import Spinner from './components/Spinner';

const POSE_INSTRUCTIONS = ['Full frontal view, hands on hips', 'Slightly turned, 3/4 view', 'Side profile view', 'Jumping in the air, mid-action shot', 'Walking towards camera', 'Leaning against a wall'];

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, [query]);
  return matches;
};

const App: React.FC = () => {
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [outfitHistory, setOutfitHistory] = useState<OutfitLayer[]>([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(defaultWardrobe);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const activeOutfitLayers = useMemo(() => outfitHistory.slice(0, currentOutfitIndex + 1), [outfitHistory, currentOutfitIndex]);
  const activeGarmentIds = useMemo(() => activeOutfitLayers.map((layer) => layer.garment?.id).filter(Boolean) as string[], [activeOutfitLayers]);

  const displayImageUrl = useMemo(() => {
    if (outfitHistory.length === 0) return modelImageUrl;
    const currentLayer = outfitHistory[currentOutfitIndex];
    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
    return currentLayer?.poseImages[poseInstruction] ?? Object.values(currentLayer?.poseImages ?? {})[0] ?? modelImageUrl;
  }, [outfitHistory, currentOutfitIndex, currentPoseIndex, modelImageUrl]);

  const availablePoseKeys = useMemo(() => {
    const currentLayer = outfitHistory[currentOutfitIndex];
    return currentLayer ? Object.keys(currentLayer.poseImages) : [];
  }, [outfitHistory, currentOutfitIndex]);

  const handleModelFinalized = (url: string) => {
    setModelImageUrl(url);
    setOutfitHistory([{ garment: null, poseImages: { [POSE_INSTRUCTIONS[0]]: url } }]);
    setCurrentOutfitIndex(0);
  };

  const handleStartOver = () => {
    setModelImageUrl(null);
    setOutfitHistory([]);
    setCurrentOutfitIndex(0);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setCurrentPoseIndex(0);
    setIsSheetCollapsed(false);
    setWardrobe(defaultWardrobe);
  };

  const handleGarmentSelect = useCallback(async (garmentFile: File, garmentInfo: WardrobeItem) => {
    if (!displayImageUrl || isLoading) return;
    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Adding ${garmentInfo.name}...`);
    try {
      const newImageUrl = await generateVirtualTryOnImage(displayImageUrl, garmentFile);
      const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
      const newLayer: OutfitLayer = { garment: garmentInfo, poseImages: { [currentPoseInstruction]: newImageUrl } };
      setOutfitHistory((prev) => [...prev.slice(0, currentOutfitIndex + 1), newLayer]);
      setCurrentOutfitIndex((prev) => prev + 1);
      setWardrobe((prev) => (prev.find((item) => item.id === garmentInfo.id) ? prev : [...prev, garmentInfo]));
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to apply garment'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [displayImageUrl, isLoading, currentPoseIndex, currentOutfitIndex]);

  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (isLoading || outfitHistory.length === 0 || newIndex === currentPoseIndex) return;
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    const currentLayer = outfitHistory[currentOutfitIndex];
    if (currentLayer.poseImages[poseInstruction]) return setCurrentPoseIndex(newIndex);

    const baseImageForPoseChange = Object.values(currentLayer.poseImages)[0];
    if (!baseImageForPoseChange) return;

    setIsLoading(true);
    setLoadingMessage('Changing pose...');
    const prevPoseIndex = currentPoseIndex;
    setCurrentPoseIndex(newIndex);
    try {
      const newImageUrl = await generatePoseVariation(baseImageForPoseChange, poseInstruction);
      setOutfitHistory((prev) => {
        const copy = [...prev];
        copy[currentOutfitIndex] = { ...copy[currentOutfitIndex], poseImages: { ...copy[currentOutfitIndex].poseImages, [poseInstruction]: newImageUrl } };
        return copy;
      });
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to change pose'));
      setCurrentPoseIndex(prevPoseIndex);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [isLoading, outfitHistory, currentPoseIndex, currentOutfitIndex]);

  return (
    <div className="font-sans">
      <AnimatePresence mode="wait">
        {!modelImageUrl ? (
          <motion.div key="start-screen" className="w-screen min-h-screen flex items-start sm:items-center justify-center bg-gray-50 p-4 pb-20"><StartScreen onModelFinalized={handleModelFinalized} /></motion.div>
        ) : (
          <motion.div key="main-app" className="relative flex flex-col h-screen bg-white overflow-hidden">
            <main className="flex-grow relative flex flex-col md:flex-row overflow-hidden">
              <div className="w-full h-full flex-grow flex items-center justify-center bg-white pb-16 relative">
                <Canvas displayImageUrl={displayImageUrl} onStartOver={handleStartOver} isLoading={isLoading} loadingMessage={loadingMessage} onSelectPose={handlePoseSelect} poseInstructions={POSE_INSTRUCTIONS} currentPoseIndex={currentPoseIndex} availablePoseKeys={availablePoseKeys} />
              </div>
              <aside className={`absolute md:relative md:flex-shrink-0 bottom-0 right-0 h-auto md:h-full w-full md:w-1/3 md:max-w-sm bg-white/80 backdrop-blur-md flex flex-col border-t md:border-l border-gray-200/60 transition-transform duration-500 ${isSheetCollapsed ? 'translate-y-[calc(100%-4.5rem)]' : 'translate-y-0'} md:translate-y-0`}>
                <button onClick={() => setIsSheetCollapsed(!isSheetCollapsed)} className="md:hidden w-full h-8 flex items-center justify-center bg-gray-100/50">{isSheetCollapsed ? <ChevronUpIcon className="w-6 h-6 text-gray-500" /> : <ChevronDownIcon className="w-6 h-6 text-gray-500" />}</button>
                <div className="p-4 md:p-6 pb-20 overflow-y-auto flex-grow flex flex-col gap-8">
                  {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md"><p className="font-bold">Error</p><p>{error}</p></div>}
                  <OutfitStack outfitHistory={activeOutfitLayers} onRemoveLastGarment={() => setCurrentOutfitIndex((i) => Math.max(0, i - 1))} />
                  <WardrobePanel onGarmentSelect={handleGarmentSelect} activeGarmentIds={activeGarmentIds} isLoading={isLoading} wardrobe={wardrobe} />
                </div>
              </aside>
            </main>
            <AnimatePresence>{isLoading && isMobile && <motion.div className="fixed inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Spinner />{loadingMessage && <p className="text-lg font-serif text-gray-700 mt-4 text-center px-4">{loadingMessage}</p>}</motion.div>}</AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer isOnDressingScreen={!!modelImageUrl} />
    </div>
  );
};

export default App;
