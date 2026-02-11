/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import type { WardrobeItem } from '../types';
import { UploadCloudIcon, CheckCircleIcon } from './icons';

interface WardrobePanelProps {
  onGarmentSelect: (garmentFile: File, garmentInfo: WardrobeItem) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
}

const urlToFile = (url: string, filename: string): Promise<File> =>
  fetch(url)
    .then((response) => response.blob())
    .then((blob) => new File([blob], filename, { type: blob.type || 'image/png' }));

const WardrobePanel: React.FC<WardrobePanelProps> = ({ onGarmentSelect, activeGarmentIds, isLoading, wardrobe }) => {
  const [error, setError] = useState<string | null>(null);

  const handleGarmentClick = async (item: WardrobeItem) => {
    if (isLoading || activeGarmentIds.includes(item.id)) return;
    setError(null);
    try {
      const file = await urlToFile(item.url, item.name);
      onGarmentSelect(file, item);
    } catch {
      setError('Failed to load wardrobe item. This is often a CORS issue.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }
      onGarmentSelect(file, { id: `custom-${Date.now()}`, name: file.name, url: URL.createObjectURL(file) });
    }
  };

  return (
    <div className="pt-6 border-t border-gray-400/50">
      <h2 className="text-xl font-serif tracking-wider text-gray-800 mb-3">Wardrobe</h2>
      <div className="grid grid-cols-3 gap-3">
        {wardrobe.map((item) => {
          const isActive = activeGarmentIds.includes(item.id);
          return (
            <button key={item.id} onClick={() => handleGarmentClick(item)} disabled={isLoading || isActive} className="relative aspect-square border rounded-lg overflow-hidden transition-all duration-200 group disabled:opacity-60">
              <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
              {isActive && <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center"><CheckCircleIcon className="w-8 h-8 text-white" /></div>}
            </button>
          );
        })}
        <label htmlFor="custom-garment-upload" className={`relative aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 ${isLoading ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer'}`}>
          <UploadCloudIcon className="w-6 h-6 mb-1" /><span className="text-xs text-center">Upload</span>
          <input id="custom-garment-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isLoading} />
        </label>
      </div>
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
    </div>
  );
};

export default WardrobePanel;
