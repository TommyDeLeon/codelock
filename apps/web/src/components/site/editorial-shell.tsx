import { SiteNav } from './site-nav';
import { SiteFooter } from '@/components/site-footer';
import '@/app/(site)/site.css';

export function EditorialShell({ children }: { children: React.ReactNode }) {
  return <div className="marketing-site">
    <SiteNav />
    {children}
    <SiteFooter />
  </div>;
}
