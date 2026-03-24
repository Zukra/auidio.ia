import { LdapSignInForm } from '@/features/auth/ui/ldap-sign-in-form';

export default function SignInPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LdapSignInForm />
      </div>
    </div>
  );
}
