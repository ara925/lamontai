declare module 'uuid' {
  export function v4(): string;
  export function v5(name: string, namespace: string): string;
  export function parse(str: string): ArrayLike<number>;
  export function stringify(arr: ArrayLike<number>): string;
  export function validate(str: string): boolean;
  export function version(str: string): number;
} 