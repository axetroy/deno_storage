export interface Storage {
  length: number;
  key(): string[];
  getItem(key: string): string;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}
