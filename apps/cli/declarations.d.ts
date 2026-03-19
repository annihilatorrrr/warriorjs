declare module 'mock-fs' {
  function mock(config: Record<string, unknown>): void;
  namespace mock {
    function restore(): void;
  }
  export default mock;
}

declare module 'array-shuffle' {
  function arrayShuffle<T>(array: T[]): T[];
  export default arrayShuffle;
}
