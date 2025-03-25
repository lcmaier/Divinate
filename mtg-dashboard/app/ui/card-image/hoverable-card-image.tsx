// app/ui/card-image/hoverable-card-image.tsx
// Complete corrected implementation

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';

export default function HoverableCardImage({
    smallImageUrl,
    largeImageUrl,
    cardName,
    width = 200,
    height = 280,
    size = "normal"
}: {
    smallImageUrl: string,
    largeImageUrl?: string,
    cardName: string,
    width?: number,
    height?: number,
    size?: "small" | "normal" | "large"
}) {
    // To determine if we're on mobile, we use state and a viewport width check
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // common mobile breakpoint
        };

        // initial check and add a resize listener
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    const [showEnlarged, setShowEnlarged] = useState(false);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const enlargedImageRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [enlargedPosition, setEnlargedPosition] = useState({ top: 0, left: 0 });
    // Add state to store calculated dimensions
    const [enlargedDimensions, setEnlargedDimensions] = useState({ width: 0, height: 0 });

    // Scryfall image sizes
    const imageSizes = {
        small: { width: 146, height: 204 },
        normal: { width: 488, height: 680 },
        large: { width: 672, height: 936 }
    };

    // If we can't find a large image, just use the small one
    const enlargedImageUrl = largeImageUrl || smallImageUrl;

    // Calculate the position of the enlarged image - memoize this function
    const calculatePosition = useCallback(() => {
        if (!imageContainerRef.current || !enlargedImageRef.current) return;

        const mediumRect = imageContainerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calculate a reasonable max size for the enlarged image
        // Don't exceed 60% of viewport height or width
        const maxHeight = viewportHeight * 0.6;
        const maxWidth = viewportWidth * 0.6;
        
        // Calculate scaled dimensions while maintaining aspect ratio
        let scaledWidth = imageSizes.large.width;
        let scaledHeight = imageSizes.large.height;

        // Scale down if needed to fit the viewport
        const scaleRatio = Math.min(
            maxWidth / scaledWidth,
            maxHeight / scaledHeight,
            1 // Don't scale down if image is already smaller than constraints
        );

        scaledWidth = Math.floor(scaledWidth * scaleRatio);
        scaledHeight = Math.floor(scaledHeight * scaleRatio);

        // Save the calculated dimensions for the Image component to use
        setEnlargedDimensions({ width: scaledWidth, height: scaledHeight });

        // Determine if there's more space above or below the small image
        const spaceAbove = mediumRect.top;
        const spaceBelow = viewportHeight - mediumRect.bottom;
        
        // Default position is to the right of the small image
        const rightEdge = mediumRect.right;
        let left = rightEdge - scaledWidth;
        left = Math.max(20, left);
        
        let top;
        
        // If more space below, align the top of both images
        if (spaceBelow >= scaledHeight || spaceBelow > spaceAbove) {
            top = mediumRect.top;
        } else {
            // If more space above, align the bottom of both images
            top = mediumRect.bottom - scaledHeight;
        }
        
        // Ensure the enlarged image stays within viewport bounds
        top = Math.max(20, Math.min(viewportHeight - scaledHeight - 20, top));
        
        setEnlargedPosition({ top, left });
    }, [imageSizes.large.height, imageSizes.large.width]);

    // function to start timer to hide enlarged image - memoize this
    const startHideTimer = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        hoverTimeoutRef.current = setTimeout(() => {
            setShowEnlarged(false);
        }, 50);
    }, []);

    // Calculate position when showing the enlarged image
    useEffect(() => {
        // Store the image URL that was used when this effect ran
        // This prevents unnecessary recalculations when only the URLs change
        const currentImageUrl = smallImageUrl;
        
        if (showEnlarged) {
            calculatePosition();
        }
        
        // Clean up function that only runs if the effect needs to re-run
        return () => {
            // Only do cleanup if this effect is re-running and not just on unmount
            if (showEnlarged && currentImageUrl !== smallImageUrl) {
                // Handle any cleanup needed for position calculation
            }
        };
    }, [showEnlarged, calculatePosition]);

    // Recalculate position on window resize and scroll
    useEffect(() => {
        const handlePositionChange = () => {
            if (showEnlarged) {
                calculatePosition();
            }
        };

        window.addEventListener('resize', handlePositionChange);
        window.addEventListener('scroll', handlePositionChange);

        return () => {
            window.removeEventListener('resize', handlePositionChange);
            window.removeEventListener('scroll', handlePositionChange);
        };
    }, [showEnlarged, calculatePosition]);

    // Memoize mouse handlers to prevent them from changing on re-renders
    const handleMouseEnter = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setShowEnlarged(true);
    }, []);

    const handleMouseLeave = useCallback((e: React.MouseEvent) => {
        // Check if mouse moves to the larger image
        const enlargedElement = enlargedImageRef.current;
        if (enlargedElement) {
            const rect = enlargedElement.getBoundingClientRect();
            const isEnteringEnlarged =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;
            
            // if not entering enlarged image, start the hide timer
            if (!isEnteringEnlarged) {
                startHideTimer();
            }
        } else {
            startHideTimer();
        }
    }, [startHideTimer]);

    // Memoize enlarged image event handlers
    const handleEnlargedMouseEnter = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    }, []);

    const handleEnlargedMouseLeave = useCallback(() => {
        startHideTimer();
    }, [startHideTimer]);

    // Clean up the timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    // Memoize hover events to prevent recreation on prop changes
    const hoverEvents = useMemo(() => {
        return isMobile ? {} : {
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave
        };
    }, [isMobile, handleMouseEnter, handleMouseLeave]);

    // For mobile, use small image size, otherwise use the requested size
    // If custom dimensions are provided, use those instead
    const defaultSize = isMobile ? "small" : size;
    const actualWidth = width || imageSizes[defaultSize].width;
    const actualHeight = height || imageSizes[defaultSize].height;
    
    // Memoize the component structure to prevent unnecessary re-renders
    const imageComponent = useMemo(() => (
        <Image
            src={smallImageUrl}
            alt={cardName}
            width={actualWidth}
            height={actualHeight}
            className="rounded-lg shadow-md"
        />
    ), [smallImageUrl, cardName, actualWidth, actualHeight]);

    // Memoize the enlarged image component
    const enlargedComponent = useMemo(() => {
        if (!showEnlarged || isMobile) return null;
        
        return (
            <div 
                ref={enlargedImageRef}
                className="fixed z-50" 
                style={{ 
                    top: `${enlargedPosition.top}px`,
                    left: `${enlargedPosition.left}px`, 
                }}
                onMouseEnter={handleEnlargedMouseEnter}
                onMouseLeave={handleEnlargedMouseLeave}
            >
                <div className="bg-white p-1 rounded-lg shadow-xl">
                    <Image
                        src={enlargedImageUrl}
                        alt={`${cardName} (enlarged)`}
                        width={enlargedDimensions.width}
                        height={enlargedDimensions.height}
                        className="rounded-lg"
                        priority
                    />
                </div>
            </div>
        );
    }, [
        showEnlarged, 
        isMobile, 
        enlargedPosition.top, 
        enlargedPosition.left, 
        enlargedImageUrl, 
        cardName, 
        enlargedDimensions.width, 
        enlargedDimensions.height,
        handleEnlargedMouseEnter,
        handleEnlargedMouseLeave
    ]);

    return (
        <div className="relative" ref={imageContainerRef}>
            <div 
                className={`cursor-pointer ${!isMobile ? 'transition-transform hover:scale-105' : ''}`}
                {...hoverEvents}
            >
                {imageComponent}
            </div>
            {enlargedComponent}
        </div>
    );
}