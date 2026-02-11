/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const apiKey = import.meta.env.VITE_API_KEY as string | undefined;
const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

const ensureApiKey = () => {
  if (!apiKey) throw new Error('Missing VITE_API_KEY environment variable.');
};

const fileToPart = async (file: File) => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
  const { mimeType, data } = dataUrlToParts(dataUrl);
  return { inline_data: { mime_type: mimeType, data } };
};

const dataUrlToParts = (dataUrl: string) => {
  const arr = dataUrl.split(',');
  if (arr.length < 2) throw new Error('Invalid data URL');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch?.[1]) throw new Error('Could not parse MIME type from data URL');
  return { mimeType: mimeMatch[1], data: arr[1] };
};

const dataUrlToPart = (dataUrl: string) => {
  const { mimeType, data } = dataUrlToParts(dataUrl);
  return { inline_data: { mime_type: mimeType, data } };
};

const generateImage = async (parts: unknown[]): Promise<string> => {
  ensureApiKey();
  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status})`);
  }

  const data = await response.json();
  const candidates = data?.candidates ?? [];
  for (const candidate of candidates) {
    const imagePart = candidate?.content?.parts?.find((p: any) => p.inline_data?.data);
    if (imagePart?.inline_data?.data) {
      return `data:${imagePart.inline_data.mime_type};base64,${imagePart.inline_data.data}`;
    }
  }
  throw new Error(data?.promptFeedback?.blockReason || 'The AI model did not return an image.');
};

export const generateModelImage = async (userImage: File): Promise<string> => {
  const userImagePart = await fileToPart(userImage);
  const prompt = 'Create a full-body, photorealistic e-commerce style studio model image from this person. Preserve identity and body type.';
  return generateImage([userImagePart, { text: prompt }]);
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImage: File): Promise<string> => {
  const modelImagePart = dataUrlToPart(modelImageUrl);
  const garmentImagePart = await fileToPart(garmentImage);
  const prompt = 'Virtual try-on: replace current clothing with provided garment while preserving face, pose, and background. Return only image.';
  return generateImage([modelImagePart, garmentImagePart, { text: prompt }]);
};

export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
  const tryOnImagePart = dataUrlToPart(tryOnImageUrl);
  return generateImage([tryOnImagePart, { text: `Generate same model and outfit in pose: ${poseInstruction}. Keep style realistic for e-commerce.` }]);
};
