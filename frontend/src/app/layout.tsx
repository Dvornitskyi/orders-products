import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AuthBootstrap from '@/components/AuthBootstrap';
import NavMenu from '@/components/NavMenu';
import TopMenu from '@/components/TopMenu';
import { isLocale } from '@/i18n/dictionaries';
import { I18nProvider } from '@/i18n/I18nProvider';
import StoreProvider from '@/store/StoreProvider';

export const metadata: Metadata = { title: 'Orders & Products', description: 'Orders & Products' };

export default function RootLayout({ children }: { children: ReactNode }) {
  // Язык выбирает пользователь (cookie "locale"). Читаем её на сервере, чтобы SSR сразу отдал нужный язык.
  const saved = cookies().get('locale')?.value;
  const locale = isLocale(saved) ? saved : 'ru';
  return (
    <html lang={locale}>
      <body>
        <StoreProvider>
          <I18nProvider initialLocale={locale}>
            <AuthBootstrap />
            <div className="app">
              <TopMenu />
              <NavMenu />
              <main className="app__main">{children}</main>
            </div>
          </I18nProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
