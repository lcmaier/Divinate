// app/ui/dashboard/sidenav.tsx

import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
// import DivinateLogo from '../divinate-logo';
import { PowerIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { beleren } from '../fonts';

export default function SideNav() {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <Link
        className="mb-2 flex h-20 items-end justify-start rounded-md bg-blue-600 p-4 md:h-40"
        href="/"
      >
        <div className="w-32 text-white md:w-40">
          {/* Inlining the logo to avoid the issue where the icon doesn't render in the sidenav*/}
          <div className={`${beleren.className} flex flex-row items-center gap-2 leading-none text-white`}>
            <SparklesIcon className="h-10 w-10 flex-shrink-0" />
            <p className="text-[36px]">Divinate</p>
          </div>
        </div>
      </Link>
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
        <form>
          <button className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
            <PowerIcon className="w-6" />
            <div className="hidden md:block">Sign Out</div>
          </button>
        </form>
      </div>
    </div>
  );
}
