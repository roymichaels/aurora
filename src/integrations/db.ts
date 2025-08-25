export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

class TonDbClient {
  from(_table: string) {
    return {
      select: async <T = any>(): Promise<QueryResult<T[]>> => ({ data: [] as T[], error: null }),
      insert: async <T = any>(_values: T): Promise<QueryResult<T>> => ({ data: null, error: null }),
      update: async <T = any>(_values: T): Promise<QueryResult<T>> => ({ data: null, error: null }),
      delete: async (): Promise<QueryResult<null>> => ({ data: null, error: null }),
    };
  }

  functions = {
    invoke: async (_fn: string, _args?: any): Promise<QueryResult<any>> => ({ data: null, error: null }),
  };

  auth = {
    getUser: async (): Promise<QueryResult<any>> => ({ data: null, error: null }),
    signOut: async (): Promise<{ error: Error | null }> => ({ error: null }),
  };

  storage = {
    from: (_bucket: string) => ({
      upload: async (_path: string, _file: Blob): Promise<QueryResult<any>> => ({ data: null, error: null }),
      createSignedUrl: async (_path: string): Promise<QueryResult<{ signedUrl: string }>> => ({
        data: { signedUrl: '' },
        error: null,
      }),
    }),
  };
}

export const db = new TonDbClient();

export async function awardXPRemote(..._args: any[]): Promise<null> {
  return null;
}

export async function upsertQuest(..._args: any[]): Promise<null> {
  return null;
}

export async function logEvent(..._args: any[]): Promise<void> {
  return;
}
