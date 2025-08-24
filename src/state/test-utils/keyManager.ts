// Provides a deterministic key for encrypting the test database.
export const keyManager = {
  getKey(): string {
    return 'testpassword';
  },
};
