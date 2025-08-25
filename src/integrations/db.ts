export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

interface QueryBuilder<T = any> extends PromiseLike<QueryResult<T[]>> {
  select(columns?: string): QueryBuilder<T>;
  insert(values?: T): QueryBuilder<T>;
  update(values?: Partial<T>): QueryBuilder<T>;
  delete(): QueryBuilder<T>;
  upsert(values: Partial<T> | Partial<T>[], options?: any): QueryBuilder<T>;
  eq(column: string, value: any): QueryBuilder<T>;
  order(column: string, options?: any): QueryBuilder<T>;
  gte(column: string, value: any): QueryBuilder<T>;
  gt(column: string, value: any): QueryBuilder<T>;
  neq(column: string, value: any): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  maybeSingle<R = T>(): Promise<QueryResult<R | null>>;
  single<R = T>(): Promise<QueryResult<R>>;
}

function createBuilder<T = any>(): QueryBuilder<T> {
  const builder: any = {
    select: (_columns?: string) => builder,
    insert: (_values?: T) => builder,
    update: (_values?: Partial<T>) => builder,
    delete: () => builder,
    upsert: (_values: Partial<T> | Partial<T>[], _options?: any) => builder,
    eq: (_column: string, _value: any) => builder,
    order: (_column: string, _options?: any) => builder,
    gte: (_column: string, _value: any) => builder,
    gt: (_column: string, _value: any) => builder,
    neq: (_column: string, _value: any) => builder,
    limit: (_count: number) => builder,
    maybeSingle: async <R = T>(): Promise<QueryResult<R | null>> => ({
      data: null,
      error: null,
    }),
    single: async <R = T>(): Promise<QueryResult<R>> => ({
      data: null as R,
      error: null,
    }),
    then: (resolve: any, reject: any) =>
      Promise.resolve({ data: [] as T[], error: null }).then(resolve, reject),
  };
  return builder as QueryBuilder<T>;
}

class TonDbClient {
  from(_table: string): QueryBuilder<any> {
    return createBuilder();
  }

  channel(_name: string) {
    const builder: any = {
      on: (_event: string, _filter: any, _callback: (...args: any[]) => void) => builder,
      subscribe: () => builder,
    };
    return builder;
  }

  removeChannel(_channel: any) {
    return;
  }

  functions = {
    invoke: async (_fn: string, _args?: any): Promise<QueryResult<any>> => ({
      data: null,
      error: null,
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
