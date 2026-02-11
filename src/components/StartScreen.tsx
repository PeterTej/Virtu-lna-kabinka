/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UploadCloudIcon } from './icons';
import { Compare } from './ui/compare';
import { generateModelImage } from '../services/geminiService';
import Spinner from './Spinner';
import { getFriendlyErrorMessage } from '../lib/utils';

interface StartScreenProps { onModelFinalized: (modelUrl: string) => void }

const StartScreen: React.FC<StartScreenProps> = ({ onModelFinalized }) => {
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return setError('Please select an image file.');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setUserImageUrl(dataUrl);
      setIsGenerating(true);
      setError(null);
      try {
        const result = await generateModelImage(file);
        setGeneratedModelUrl(result);
      } catch (err) {
        setError(getFriendlyErrorMessage(err, 'Failed to create model'));
        setUserImageUrl(null);
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {!userImageUrl ? (
        <motion.div key="uploader" className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="lg:w-1/2">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 leading-tight">Create Your Model for Any Look.</h1>
            <p className="mt-4 text-lg text-gray-600">Upload a photo and let AI create a studio-ready model for realistic try-on previews suitable for e-commerce.</p>
            <label htmlFor="image-upload-start" className="mt-6 inline-flex items-center px-8 py-3 text-base font-semibold text-white bg-gray-900 rounded-md cursor-pointer hover:bg-gray-700"><UploadCloudIcon className="w-5 h-5 mr-3"/>Upload Photo</label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <div className="w-full lg:w-1/2 flex justify-center"><Compare firstImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon.jpg" secondImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon-model.png" slideMode="drag" className="w-full max-w-sm aspect-[2/3] rounded-2xl bg-gray-200"/></div>
        </motion.div>
      ) : (
        <motion.div key="compare" className="w-full max-w-6xl mx-auto h-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="md:w-1/2">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900">The New You</h1>
            {isGenerating && <div className="flex items-center gap-3 text-lg text-gray-700 font-serif mt-6"><Spinner /><span>Generating your model...</span></div>}
            {generatedModelUrl && !isGenerating && !error && <button onClick={() => onModelFinalized(generatedModelUrl)} className="mt-8 px-8 py-3 text-base font-semibold text-white bg-gray-900 rounded-md hover:bg-gray-700">Proceed to Styling →</button>}
          </div>
          <div className="md:w-1/2 w-full flex items-center justify-center">
            <Compare firstImage={userImageUrl} secondImage={generatedModelUrl ?? userImageUrl} slideMode="drag" className="w-[280px] h-[420px] sm:w-[320px] sm:h-[480px] lg:w-[400px] lg:h-[600px] rounded-2xl bg-gray-200" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StartScreen;
