// app/ui/divinate-logo.tsx

import { SparklesIcon } from '@heroicons/react/24/outline';
import { beleren } from '@/app/ui/fonts';

export default function DivinateLogo() {
  return (
    <div
      className={`${beleren.className} flex flex-row items-center leading-none text-white`}
    >
      <SparklesIcon className="h-12 w-12" />
      <p className="text-[44px]">Divinate</p>
    </div>
  );
}