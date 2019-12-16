import { Storage } from "./storage.ts";

const mapSymbol = Symbol("the_map_symbol_that_user_should_not_use");

interface Map {
  [k: string]: string;
}

export class SessionStorage implements Storage {
  private [mapSymbol]: Map = {};
  get length() {
    return this.key().length;
  }
  key() {
    return Object.keys(this[mapSymbol]);
  }
  getItem(key: string) {
    const val = this[mapSymbol][key];
    return val === undefined ? null : val;
  }

  setItem(key: string, value: string) {
    this[mapSymbol][key] = value.toString();
  }

  removeItem(key: string) {
    delete this[mapSymbol][key];
  }

  clear() {
    for (const key in this[mapSymbol]) {
      delete this[mapSymbol][key];
    }
  }
}
