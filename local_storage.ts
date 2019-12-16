import { readJsonSync } from "https://deno.land/std/fs/read_json.ts";
import { writeJsonSync } from "https://deno.land/std/fs/write_json.ts";
import { existsSync } from "https://deno.land/std/fs/exists.ts";
import { join } from "https://deno.land/std/path/mod.ts";

import { Storage } from "./storage.ts";
const { openSync } = Deno;

const mapSymbol = Symbol("the_map_symbol_that_user_should_not_use");

interface Location {
  start: number;
  length: number;
}

interface Map {
  [k: string]: Location;
}

interface Options {
  domain: string;
}

const home = Deno.homeDir();

export class LocalStorage extends Storage {
  private [mapSymbol]: Map = {};
  private storageFilename: string;
  private storageMapFilename: string;
  constructor(options: Options) {
    super();
    const domainDir = join(
      home,
      ".deno",
      "storage",
      "localstorage",
      options.domain
    );
    this.storageFilename = join(domainDir, "storage");
    const storageMapFilename = (this.storageMapFilename =
      this.storageFilename + ".map");

    if (existsSync(storageMapFilename)) {
      try {
        const json = readJsonSync(storageMapFilename) as Map;

        this[mapSymbol] = json;
      } catch {
        writeJsonSync(storageMapFilename, {});
      }
    }
  }
  get length() {
    return this.key().length;
  }
  key() {
    return Object.keys(this[mapSymbol]);
  }
  getItem(key: string) {
    const file = openSync(this.storageFilename, "r");

    try {
      const location = this[mapSymbol][key];

      if (!location) return null;

      file.seekSync(location.start, 0);

      const byte = new Uint8Array(location.length);

      file.readSync(byte);

      const value = new TextDecoder().decode(byte);

      file.close();

      return value;
    } catch (err) {
      file.close();
      throw err;
    }
  }

  setItem(key: string, value: string) {
    const { len: currentLength } = Deno.statSync(this.storageFilename);

    // If the file size exceeds 10M, an exception should be thrown
    // This is also the upper limit of browser storage
    if (currentLength > 1024 * 1024 * 10) {
      throw new Error("Out of limit");
    }

    let err: Error;

    const file = openSync(this.storageFilename, "r+");

    try {
      const bytes = new TextEncoder().encode(value);

      const existLocation = this[mapSymbol][key];

      let location: Location;

      // if location have exist
      if (existLocation) {
        // then update the value
        this.removeItem(key);
        this.setItem(key, value);
      } else {
        // if not exist. then append to the end
        location = {
          start: currentLength,
          length: bytes.byteLength
        };

        file.seekSync(currentLength, 0);

        file.writeSync(bytes);

        this[mapSymbol][key] = location;
      }
    } catch (e) {
      err = e;
    } finally {
      file.seekSync(0, 0); // reset offset
      file.close(); // close file
    }

    if (err) {
      throw err;
    }

    writeJsonSync(this.storageMapFilename, this[mapSymbol]);
  }

  removeItem(key: string) {
    // delete location
    const location = this[mapSymbol][key];

    // delete data from file
    if (location) {
      // TODO: Optimize algorithms to improve performance
      const bytes = Deno.readFileSync(this.storageFilename);
      const start = location.start;
      const end = location.start + location.length;

      const newBytes = new Uint8Array(bytes.byteLength - location.length);

      let index = 0;

      for (const [i, b] of bytes.entries()) {
        if (i >= start && i < end) {
          continue;
        }

        newBytes[index] = b;
        index++;
      }

      Deno.writeFileSync(this.storageFilename, newBytes);

      // If the data is not the last element
      // so we should update the location
      if (end !== bytes.byteLength) {
        for (const key in this[mapSymbol]) {
          const l = this[mapSymbol][key];

          // If it is later data, you should change the start position
          if (l.start > location.start) {
            l.start = l.start - location.length;
          }
        }

        // update map file
        writeJsonSync(this.storageMapFilename, this[mapSymbol]);
      }
    }

    delete this[mapSymbol][key];
  }

  clear() {
    for (const key in this[mapSymbol]) {
      this.removeItem(key);
    }
  }
}
