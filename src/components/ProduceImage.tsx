import { useState } from 'react';
import { Sprout } from 'lucide-react';

interface ProduceImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProduceImage({ src, alt, className = 'w-full h-full object-cover' }: ProduceImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#E8F5E9] to-[#DCE8D8] text-[#1B5E20] p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sprout className="w-8 h-8 mb-2 opacity-70" aria-hidden="true" />
        <span className="text-xs font-medium text-[#1B5E20]/80 line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
