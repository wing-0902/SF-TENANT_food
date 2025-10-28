const allowedAdminUser: string[] = [
  'tsubasa',
  'admin',
  'guest',
  'test',
]

export function メールアドレスを分割(address: string): string {
  const parts = address.split('@');
  return parts[0];
};

export function ロールを判定(userNameFromMail: string): string {
  if ( allowedAdminUser.includes(userNameFromMail)) {
    return 'admin';
  } else {
    return userNameFromMail;
  }
};