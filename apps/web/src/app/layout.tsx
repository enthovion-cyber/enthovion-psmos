import type { Metadata } from 'next';
import '@/styles/globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { SidebarProvider } from '@/providers/SidebarProvider';

export const metadata: Metadata = {
  title: 'PSM OS',
  description: 'Process Safety Management Operating System'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <ThemeProvider>
          <ToastProvider>
            <SidebarProvider>
              <QueryProvider>{children}</QueryProvider>
            </SidebarProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
