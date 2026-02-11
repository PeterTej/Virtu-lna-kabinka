/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFriendlyErrorMessage(error: unknown, context: string): string {
  let rawMessage = 'An unknown error occurred.';
  if (error instanceof Error) rawMessage = error.message;
  else if (typeof error === 'string') rawMessage = error;
  else if (error) rawMessage = String(error);

  if (rawMessage.includes('Unsupported MIME type')) {
    try {
      const errorJson = JSON.parse(rawMessage);
      const nestedMessage = errorJson?.error?.message;
      if (nestedMessage && nestedMessage.includes('Unsupported MIME type')) {
        const mimeType = nestedMessage.split(': ')[1] || 'unsupported';
        return `File type '${mimeType}' is not supported. Please use PNG, JPEG, or WEBP.`;
      }
    } catch {
      // noop
    }
    return 'Unsupported file format. Please upload PNG, JPEG, or WEBP.';
  }

  return `${context}. ${rawMessage}`;
}
