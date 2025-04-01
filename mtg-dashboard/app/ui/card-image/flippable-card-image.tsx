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
        <div 
      className="relative group card-container"
      style={{ 
        perspective: '1000px',
        width: `${width}px`, 
        height: `${height}px` 
      }}
    >
      <div 
        className="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d"
        style={{ 
          transformStyle: 'preserve-3d',
          transform: showBackFace ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front face */}
        <div 
          className="absolute w-full h-full backface-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
          }}
        >
          <SimpleCardImage
            imageUrl={frontImageUrl}
            cardName={frontCardName}
            width={width}
            height={height}
          />
        </div>

        {/* Back face */}
        <div 
          className="absolute w-full h-full backface-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
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
        className="absolute bottom-2 left-2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1.5 shadow-md opacity-50 group-hover:opacity-100 transition-opacity duration-200 z-10"
        aria-label={showBackFace ? `Show ${frontCardName}` : `Show ${backCardName}`}
      >
        <RotateCcw className="h-5 w-5" />
      </button>
    </div>
    );
  }
