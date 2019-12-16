import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { runIfMain, test } from "https://deno.land/std/testing/mod.ts";
import { ensureFileSync, ensureDirSync } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { readJsonSync } from "https://deno.land/std/fs/read_json.ts";
import { LocalStorage } from "./local_storage.ts";

const home = Deno.homeDir();

ensureDirSync("localstorage");

function createTestDomain(
  domain: string,
  fn: (storageFilename: string, mapFilename: string) => void
) {
  const domainDir = path.join(home, ".deno", "localstorage", domain);
  ensureDirSync(domainDir);

  const storageFilename = path.join(domainDir, "storage");
  const mapFilename = storageFilename + ".map";

  ensureFileSync(storageFilename);
  ensureFileSync(mapFilename);

  test({
    name: "test " + fn.name,
    fn: () => {
      let err: Error;
      try {
        fn(storageFilename, mapFilename);
      } catch (e) {
        err = e;
      } finally {
        Deno.removeSync(domainDir, { recursive: true });
      }

      if (err) {
        throw err;
      }
    }
  });
}

createTestDomain("axetroy.xyz", function testLocalStorageInit(
  storageFilename,
  mapFilename
) {
  assertEquals(Deno.readFileSync(storageFilename).byteLength, 0);
  assertEquals(Deno.readFileSync(mapFilename).byteLength, 0);

  const localStorage = new LocalStorage({ domain: "axetroy.xyz" });

  assertEquals(Deno.readFileSync(storageFilename).byteLength, 0);
  assertEquals(Deno.readFileSync(mapFilename).byteLength, 2);

  assertEquals(localStorage.length, 0);
  assertEquals(localStorage.key.length, 0);
});

createTestDomain("deno.land", function testSimpleSetAndGet(
  storageFilename,
  mapFilename
) {
  const localStorage = new LocalStorage({ domain: "deno.land" });

  const key = "foo";
  const value = "bar";
  const valueByte = new TextEncoder().encode(value);

  localStorage.setItem(key, value);

  // check storage file
  const fileBytes = Deno.readFileSync(storageFilename);

  assertEquals(fileBytes, valueByte);

  // check map file
  const json = readJsonSync(mapFilename);

  assertEquals(json[key], { start: 0, length: valueByte.byteLength });

  assertEquals(localStorage.getItem(key), value);
  assertEquals(localStorage.getItem("unknown_key"), null);
});

createTestDomain("example.com", function testAppendMultipleKeys(
  storageFilename,
  mapFilename
) {
  const localStorage = new LocalStorage({ domain: "example.com" });

  const key1 = "foo";
  const value1 = "bar";
  const value1Byte = new TextEncoder().encode(value1);

  // set one key
  {
    localStorage.setItem(key1, value1);

    // check storage file
    const fileBytes = Deno.readFileSync(storageFilename);

    assertEquals(fileBytes, value1Byte);

    // check map file
    const json = readJsonSync(mapFilename);

    assertEquals(json[key1], { start: 0, length: value1Byte.byteLength });
    assertEquals(localStorage.getItem(key1), value1);
  }

  const key2 = "hello";
  const value2 = "world";
  const value2Byte = new TextEncoder().encode(value2);

  // set two key
  {
    localStorage.setItem(key2, value2);

    // check storage file
    const fileBytes = Deno.readFileSync(storageFilename);

    const newBytes = new Uint8Array(
      value1Byte.byteLength + value2Byte.byteLength
    );

    newBytes.set(value1Byte);
    newBytes.set(value2Byte, value1Byte.byteLength);

    assertEquals(fileBytes, newBytes);

    // check map file
    const json = readJsonSync(mapFilename);

    assertEquals(json[key2], {
      start: value1Byte.byteLength,
      length: value2Byte.byteLength
    });
    assertEquals(localStorage.getItem(key2), value2);
  }

  assertEquals(localStorage.getItem(key1), value1);
  assertEquals(localStorage.getItem(key2), value2);
});

createTestDomain("example1.com", function testResetMultipleKeys(
  storageFilename,
  mapFilename
) {
  const localStorage = new LocalStorage({ domain: "example1.com" });

  const key1 = "foo";
  const value1 = "bar";
  const value1Byte = new TextEncoder().encode(value1);

  // set one key
  {
    localStorage.setItem(key1, value1);

    // check storage file
    const fileBytes = Deno.readFileSync(storageFilename);

    assertEquals(fileBytes, value1Byte);

    // check map file
    const json = readJsonSync(mapFilename);

    assertEquals(json[key1], { start: 0, length: value1Byte.byteLength });
    assertEquals(localStorage.getItem(key1), value1);
  }

  const key2 = "hello";
  const value2 = "world";
  const value2Byte = new TextEncoder().encode(value2);

  // set two key
  {
    localStorage.setItem(key2, value2);

    // check storage file
    const fileBytes = Deno.readFileSync(storageFilename);

    const newBytes = new Uint8Array(
      value1Byte.byteLength + value2Byte.byteLength
    );

    newBytes.set(value1Byte);
    newBytes.set(value2Byte, value1Byte.byteLength);

    assertEquals(fileBytes, newBytes);

    // check map file
    const json = readJsonSync(mapFilename);

    assertEquals(json[key2], {
      start: value1Byte.byteLength,
      length: value2Byte.byteLength
    });
    assertEquals(localStorage.getItem(key2), value2);
  }

  const newValue = "new value";
  // set three key
  {
    const newValueByte = new TextEncoder().encode(newValue);
    localStorage.setItem(key1, newValue);

    // check storage file
    const fileBytes = Deno.readFileSync(storageFilename);

    const newBytes = new Uint8Array(
      value2Byte.byteLength + newValueByte.byteLength
    );

    newBytes.set(value2Byte);
    newBytes.set(newValueByte, value2Byte.byteLength);

    assertEquals(fileBytes, newBytes);

    // check map file
    const json = readJsonSync(mapFilename);

    assertEquals(json[key1], {
      start: value2Byte.byteLength,
      length: newValueByte.byteLength
    });
    assertEquals(localStorage.getItem(key1), newValue);
  }

  assertEquals(localStorage.getItem(key1), newValue);
  assertEquals(localStorage.getItem(key2), value2);
});

runIfMain(import.meta);
