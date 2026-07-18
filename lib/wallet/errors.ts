export class InvalidWalletAmountError extends Error {
  constructor() {
    super("Wallet amount must be a positive safe integer.");
    this.name = "InvalidWalletAmountError";
  }
}

export class InsufficientWalletBalanceError extends Error {
  constructor() {
    super("Insufficient wallet balance.");
    this.name = "InsufficientWalletBalanceError";
  }
}

export class WalletIdempotencyConflictError extends Error {
  constructor() {
    super("Idempotency key was already used for another transaction.");
    this.name = "WalletIdempotencyConflictError";
  }
}
