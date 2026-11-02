'use client';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { keepUnfixed, validateLogin, type Errors, type LoginValues } from '@/validation';
import { login } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';
import TextField from '@/components/ui/TextField';

export default function LoginForm() {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [v, setV] = useState<LoginValues>({ login: '', password: '' });
  const [errors, setErrors] = useState<Errors<LoginValues>>({});
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const edit = (k: keyof LoginValues) => (val: string) => {
    const next = { ...v, [k]: val };
    setV(next);
    setErrors((prev) => keepUnfixed(prev, validateLogin(next)));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validateLogin(v);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true); setFailed(false);
    const res = await dispatch(login(v));
    setBusy(false);
    if (login.fulfilled.match(res)) router.push('/orders'); else setFailed(true);
  };

  return (
    <section className="login">
      <h1 className="page-title">{t('loginTitle')}</h1>
      <form className="login__form" onSubmit={submit} noValidate>
        <TextField id="l-login" label={t('loginLabel')} value={v.login} onChange={edit('login')} error={errors.login} />
        <TextField id="l-pass" label={t('passwordLabel')} type="password" value={v.password} onChange={edit('password')} error={errors.password} />
        {failed && <div className="alert alert-danger" role="alert">{t('loginFailed')}</div>}
        <button type="submit" className="btn btn-success w-100" disabled={busy}>{t('login')}</button>
        <p className="login__hint">{t('loginHint')}</p>
      </form>
    </section>
  );
}
