declare module "sql.js" {
  export interface Statement {
    step(): boolean;
    getAsObject(): unknown;
    free(): void;
  }

  export interface Database {
    run(sql: string): void;
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export interface SqlJsStatic {
    Database: {
      new (data?: Uint8Array): Database;
    };
  }

  export default function initSqlJs(config?: {
    locateFile?: (file: string, prefix?: string) => string;
  }): Promise<SqlJsStatic>;
}
