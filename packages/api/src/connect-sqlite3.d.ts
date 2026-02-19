declare module 'connect-sqlite3' {
  import session from 'express-session';

  interface SQLiteStoreOptions {
    db?: string;
    dir?: string;
    table?: string;
    concurrentDB?: boolean;
  }

  interface SQLiteStoreClass {
    new (options?: SQLiteStoreOptions): session.Store;
  }

  function connectSqlite3(session: typeof import('express-session')): SQLiteStoreClass;

  export = connectSqlite3;
}
