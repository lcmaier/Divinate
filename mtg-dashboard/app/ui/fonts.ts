import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
 
export const inter = Inter({ subsets: ['latin'] });
export const beleren = localFont({
    src: '../../public/fonts/Beleren-Bold.ttf',
    display: 'swap',
    variable: '--font-beleren',
    weight: '700',
});