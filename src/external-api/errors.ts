export class ExternalApiError extends Error {
  code: number;
  // message: string | null;

  constructor(code: number, message?: string) {
    super();
    this.code = code;
    this.message = message ?? '';
  }

  getErrorMessage() {
    return `{ "status": ${this.code}, "message": ${this.message} }`;
  }
}
