import type { AuthEvent, AuthEventPublisher } from '@/features/auth/server/auth-events';
import type { Prisma } from '@/db/generated/prisma/client';
import { prisma } from '@/db/prisma';

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

    const updateData = {
      adGuid: event.adGuid,
      email: (profile.mail as string | null | undefined) ?? null,
      fullName: (profile.displayName as string | null | undefined) ?? null,
      active: (profile.isActive as boolean | undefined) ?? false,
    } satisfies Prisma.UserUpdateInput;

    const createData = {
      adLogin: event.userId,
      ...updateData,
    } satisfies Prisma.UserCreateInput;

    try {
      await prisma.user.upsert({
        where: { adLogin: event.userId },
        create: createData,
        update: updateData,
      });
    } catch {
      throw new Error('Ошибка обновления данных пользователя');
    }
  }
}
