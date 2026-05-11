// Auth flows: local register/login, Google OAuth, current-user lookup.
// All functions are placeholders pending the next prompt.

export async function register(_input: {
  email: string;
  password: string;
  displayName: string;
  username: string;
}): Promise<never> {
  throw new Error('authService.register not implemented');
}

export async function login(_input: { email: string; password: string }): Promise<never> {
  throw new Error('authService.login not implemented');
}

export async function googleSignIn(_idToken: string): Promise<never> {
  throw new Error('authService.googleSignIn not implemented');
}

export async function getCurrentUser(_userId: string): Promise<never> {
  throw new Error('authService.getCurrentUser not implemented');
}
