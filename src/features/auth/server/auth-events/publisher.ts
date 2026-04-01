import type { AuthEvent, AuthEventPublisher } from '@/features/auth/server/auth-events/types';

export class NoopAuthEventPublisher implements AuthEventPublisher {
  public async emit(_event: AuthEvent): Promise<void> {
    void _event;

    return Promise.resolve();
  }
}

export class ConsoleAuthEventPublisher implements AuthEventPublisher {
  public async emit(event: AuthEvent): Promise<void> {
    console.info('[AuthEvent]', event);

    return Promise.resolve();
  }
}

let authEventPublisher: AuthEventPublisher = new NoopAuthEventPublisher();

export function setAuthEventPublisher(publisher: AuthEventPublisher): void {
  authEventPublisher = publisher;
}

export function getAuthEventPublisher(): AuthEventPublisher {
  return authEventPublisher;
}
