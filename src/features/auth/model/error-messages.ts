const ERROR_MESSAGES: Record<string, string> = {
  LDAP_SERVER_UNREACHABLE: 'Сервер LDAP недоступен. Проверьте адрес сервера, сеть или VPN.',
  LDAP_INVALID_CREDENTIALS: 'Неверный логин или пароль.',
  LDAP_USER_NOT_FOUND: 'Пользователь не найден в LDAP.',
  LDAP_ACCOUNT_NOT_ACTIVE: 'Учетная запись не активна.',
  LDAP_CONFIG_ERROR: 'Ошибка конфигурации LDAP',
  LDAP_AUTH_FAILED: 'Ошибка авторизации LDAP. Попробуйте ещё раз позже.',
  CredentialsSignin: 'Неверный логин или пароль.',
  AccessDenied: 'Доступ запрещён. Обратитесь к администратору.',
  Configuration: 'Ошибка конфигурации авторизации.',
  Verification: 'Ошибка верификации сессии.',
  OAuthSignin: 'Ошибка запуска авторизации.',
  OAuthCallback: 'Ошибка обработки ответа авторизации.',
  OAuthCreateAccount: 'Не удалось создать аккаунт.',
  EmailCreateAccount: 'Не удалось создать аккаунт через email.',
  Callback: 'Ошибка callback авторизации.',
  OAuthAccountNotLinked: 'Аккаунт уже привязан к другому способу входа.',
  EmailSignin: 'Ошибка входа по email.',
  SessionRequired: 'Для доступа требуется авторизация. Пожалуйста, войдите снова.',
  SessionExpired: 'Сессия истекла. Авторизуйтесь повторно.',
  Default: 'Не удалось выполнить вход. Попробуйте снова.',
};

export function getAuthErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) {
    return null;
  }

  return ERROR_MESSAGES[errorCode] ?? errorCode;
}

/* const AUTH_ERROR_MESSAGES: Record<string, string> = {
  ldap_unavailable: 'Не получается связаться с корпоративной сетью. Проверьте VPN/интернет и попробуйте позже.',
  missing_refresh: 'Сессия истекла. Пожалуйста, войдите заново.',
  invalid_token_type: 'Сессия устарела. Выполните вход снова.',
  invalid_token_payload: 'Не удалось подтвердить вашу сессию. Войдите ещё раз.',
  token_expired: 'Сессия истекла. Авторизуйтесь повторно.',
  invalid_audience:
    'Не удалось подтвердить доступ. Авторизуйтесь снова или обратитесь в поддержку.',
  invalid_issuer:
    'Не удалось подтвердить источник доступа. Авторизуйтесь снова или обратитесь в поддержку.',
  invalid_token: 'Сессия недействительна. Пожалуйста, войдите заново.',
}; */

/* const STATUS_FALLBACK_MESSAGES: Record<number, string> = {
  401: 'Доступ запрещён. Авторизуйтесь повторно.',
  403: 'Доступ отклонён. Обратитесь к администратору, если считаете это ошибкой.',
  500: 'Произошла ошибка сервера. Попробуйте позже.',
  503: 'Сервис временно недоступен. Попробуйте ещё раз через пару минут.',
}; */
