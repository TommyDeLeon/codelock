import { Newsreader } from 'next/font/google';
import { SiteNav } from './site-nav';
import { SiteFooter } from '@/components/site-footer';
import '@/app/(site)/site.css';

const editorial = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-editorial',
  display: 'swap',
});

export function EditorialShell({ children }: { children: React.ReactNode }) {
  return <div className={`marketing-site ${editorial.variable}`}>
    <SiteNav />
    {children}
    <SiteFooter />
  </div>;
}
