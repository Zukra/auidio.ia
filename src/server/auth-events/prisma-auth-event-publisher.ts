import type { AuthEvent, AuthEventPublisher } from '@/features/auth/server/auth-events';
import { prisma } from '@/server/db/prisma';

export class PrismaAuthEventPublisher implements AuthEventPublisher {
  public async emit(event: AuthEvent): Promise<void> {
    switch (event.type) {
      case 'auth.login':
      case 'auth.user_update':
        await this.upsertUserByEvent(event);

        break;
      case 'auth.logout':
        await this.handleLogoutEvent(event);

        break;
      default: {
        const neverType: never = event.type;
        throw new Error(`Unsupported auth event type: ${neverType}`);
      }
    }
  }

  private async handleLogoutEvent(event: AuthEvent): Promise<void> {
    void event;
    // Do nothing on logout by design.
    return Promise.resolve();
  }

  private async upsertUserByEvent(event: AuthEvent): Promise<void> {
    const profile = (event.payload.profile ?? null) as Record<string, unknown> | null;

    if (!profile) {
      return;
    }

    const data = {
      email: profile.mail ?? null,
      name: profile.displayName ?? '',
      shortName: profile.cn ?? profile.displayName,
      active: profile.isActive ?? false,
    } as Record<string, unknown>;

    try {
      await prisma.user.upsert({
        where: { account: event.userId },
        create: { ...data, ...{ account: event.userId } },
        update: data,
      });

    } catch {
      throw new Error('Ошибка обновления данных пользователя');
    }
  }
}
