/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
}

export interface OutfitLayer {
  garment: WardrobeItem | null;
  poseImages: Record<string, string>;
}
