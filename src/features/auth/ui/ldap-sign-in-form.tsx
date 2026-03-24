'use client';

import { SyntheticEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { getAuthErrorMessage } from '@/features/auth/model/error-messages';

type FormState = {
  username: string;
  password: string;
};

const INITIAL_FORM_STATE: FormState = { username: '', password: '' };

export function LdapSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const queryErrorMessage = getAuthErrorMessage(searchParams.get('error'));

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError(null);
    setIsSubmitting(true);

    const result = await signIn('credentials', {
      // username: form.username,
      // password: form.password,
      username: process.env.NEXT_PUBLIC_SERVICE_USER,
      password: process.env.NEXT_PUBLIC_SERVICE_PASS,
      callbackUrl,
      redirect: false,
    });

    setIsSubmitting(false);

    if (!result?.ok) {
      setRequestError(getAuthErrorMessage(result?.error ?? 'unknown'));

      return;
    }

    router.replace(result.url ?? callbackUrl);
  };

  const visibleError = requestError ?? queryErrorMessage;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>LDAP авторизация</CardTitle>
          <CardDescription>
            Введите доменный логин и пароль.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Логин</FieldLabel>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="DOMAIN\\username"
                  autoComplete="username"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Пароль</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  autoComplete="current-password"
                  required
                />
              </Field>
              <FieldError>{visibleError}</FieldError>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Входим...' : 'Войти'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
