import { auth } from '@/features/auth/index.server';

export default async function Profile() {
  const session = await auth();
  // const { token, user } = session;

  return (
    <div>
      <h1>{session?.user?.cn}</h1>
      <h1>{session?.user?.department}</h1>
      <div>
        Access Token: {session?.token?.jti}
      </div>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
