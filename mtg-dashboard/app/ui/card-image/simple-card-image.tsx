// ui/card-image/simple-card-image.tsx
import Image from 'next/image';

export default function SimpleCardImage ({
    imageUrl,
    cardName,
    width = 146,
    height = 204,
    className = "",
}: {
    imageUrl: string,
    cardName: string,
    width?: number,
    height?: number,
    className?: string
}) {
    return (
        <div className={`${className}`}>
            <Image
            src={imageUrl}
            alt={cardName}
            width={width}
            height={height}
            className="rounded-lg shadow-md"
        />
        </div>
    )
}