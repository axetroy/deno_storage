[![Build Status](https://github.com/axetroy/deno_storage/workflows/test/badge.svg)](https://github.com/axetroy/deno_storage/actions)


# deno_storage

This is an exploration of Deno's Storage APIs.

#### Goal

```bash
$ cat setItem.ts
localStorage.setItem("foo", "bar");
# Set the value of the specified domain
$ deno run --domain=deno.land setItem.ts
$ cat getItem.ts
localStorage.getItem("foo");
# Get the value of the specified domain
$ deno run --domain=deno.land getItem.ts
bar
# Cannot get value because no domain was provide
$ deno run getItem.ts
null
```

## Usage

```typescript
import {
  LocalStorage,
  SessionStorage
} from "https://lib.axetroy.xyz/github.com/axetroy/deno_storage";

// when process exits
// sessionStorage is just memory storage, so when the process exits, data is also lost
const sessionStorage = new SessionStorage();

// localStorage is based on the file system
// Is persistent storage, when the process exits, the next load of data still exists
const localStorage = new LocalStorage({ domain: "deno.land" });

localStorage.setItem("foo", "bar");
localStorage.getItem("foo");
```

## Don't use it in production environment

This is just an exploration of Deno's localStorage

There are still many problems

- Not using a mature K-V database, eg. Chrome uses leveldb

- Problems with performance (Not fast enough)

## License

The [MIT License](LICENSE)
