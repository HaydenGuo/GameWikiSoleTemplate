export class OpsError extends Error {
  constructor(
    message: string,
    public readonly fix: string,
  ) {
    super(message);
    this.name = 'OpsError';
  }
}
