import { getTranslations } from 'next-intl/server';
import { getAdminLocale } from '@/server/admin-locale';
import { isRtl } from '@/i18n/routing';
import { AdminLoginForm } from '@/components/admin/login-form';

export default async function AdminLoginPage() {
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'admin.login' });

  return (
    <AdminLoginForm
      dir={isRtl(locale) ? 'rtl' : 'ltr'}
      title={t('title')}
      emailLabel={t('email')}
      passwordLabel={t('password')}
      signIn={t('signIn')}
      signingIn={t('signingIn')}
      invalidCredentials={t('error')}
    />
  );
}
