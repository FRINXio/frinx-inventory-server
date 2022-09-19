class CustomArangoError extends Error {
  private code: number;

  constructor(message: string, code: number) {
    super(message);
    this.name = 'CustomArangoError';
    this.code = code;
    this.message = `${code}: ${message}`;
  }
}

export default CustomArangoError;
