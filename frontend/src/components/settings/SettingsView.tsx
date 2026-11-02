'use client';
import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';
import { formatLong, pad } from '@/utils/format';
import { tokenExpiresAt } from '@/utils/jwt';
import { logout } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

export default function SettingsView() {
  const { t, months } = useI18n();
  const dispatch = useAppDispatch();
  const { token, login, ready } = useAppSelector((s) => s.auth);
  const exp = token ? tokenExpiresAt(token) : null;
  const until = exp ? new Date(exp) : null;
  const untilText = until
    ? `${formatLong(`${until.getFullYear()}-${pad(until.getMonth() + 1)}-${pad(until.getDate())} 00:00:00`, months)}, ${pad(until.getHours())}:${pad(until.getMinutes())}`
    : '';

  return (
    <section>
      <div className="page-head"><h1 className="page-title">{t('settingsTitle')}</h1></div>
      <div className="settings">
        <div className="settings__card">
          <h2 className="settings__title">{t('settingsLanguage')}</h2>
          <LanguageSwitcher />
        </div>
        <div className="settings__card">
          <h2 className="settings__title">{t('settingsAccount')}</h2>
          {ready && token ? (
            <>
              <p className="settings__line"><b>{login}</b></p>
              {untilText && <p className="settings__line text-muted">{t('settingsSessionUntil')}: {untilText}</p>}
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => dispatch(logout())}>{t('logout')}</button>
            </>
          ) : ready ? (
            <p className="settings__line text-muted">{t('settingsGuest')} — <Link href="/login">{t('login')}</Link></p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
