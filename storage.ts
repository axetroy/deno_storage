export interface IStorage {
  readonly length: number;
  key(): string[];
  getItem(key: string): string;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

export class Storage implements IStorage {
  get length() {
    return 0;
  }
  key() {
    return [];
  }
  getItem(key: string) {
    return null;
  }
  setItem(key: string, value: string): void {
    return;
  }
  removeItem(key: string) {
    return;
  }
  clear() {
    return;
  }
}
