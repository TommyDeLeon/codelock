import { EditorialShell } from '@/components/site/editorial-shell';

/** Marketing styles are scoped here; the desktop lock surface has its own layout. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <EditorialShell>
      <main id="main" className="flex-1">
        {children}
      </main>
    </EditorialShell>
  );
}
