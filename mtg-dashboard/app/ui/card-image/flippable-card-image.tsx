// app/ui/card-image/flippable-card-image.tsx

import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import Image from 'next/image';
import SimpleCardImage from './simple-card-image';

interface FlippableCardImageProps {
    frontImageUrl: string;
    backImageUrl: string;
    frontCardName: string;
    backCardName: string;
    width?: number;
    height?: number;
    showBackFace: boolean;
    onFlip: () => void; // callback prop for updating other components on user flipping the card
  }
  
  export default function FlippableCardImage({
    frontImageUrl,
    backImageUrl,
    frontCardName,
    backCardName,
    width = 244,
    height = 340,
    showBackFace,
    onFlip
  }: FlippableCardImageProps) {
    return (
        <div className="relative group">
            <div className="relative transition-all duration-300 transform perspective-1000">
                <div className={`relative ${showBackFace ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                    <SimpleCardImage
                        imageUrl={frontImageUrl}
                        cardName={frontCardName}
                        width={width}
                        height={height}
                    />
                </div>

                <div className={`absolute top-0 left-0 ${showBackFace ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                    <SimpleCardImage
                        imageUrl={backImageUrl}
                        cardName={backCardName}
                        width={width}
                        height={height}
                    />
                </div>
            </div>

            {/* Flip button */}
            <button
                onClick={onFlip}
                className="absolute bottom-2 left-2 bg-white/80 hover:hb-white text-gray-800 rounded-full p-1.5 shadow-md opacity-70 group-hover:opacity-100 transition-opacity duration-200"
                aria-label={showBackFace ? `Show ${frontCardName}` : `Show ${backCardName}`}
            >
                <RotateCcw className="h-5 w-5" />
            </button>
        </div>
    );
  }
