export class PostNotFoundError extends Error {
  constructor() {
    super("Post not found.");
    this.name = "PostNotFoundError";
  }
}

export class PostIsNotPremiumError extends Error {
  constructor() {
    super("Post is not premium.");
    this.name = "PostIsNotPremiumError";
  }
}

export class InvalidPremiumPriceError extends Error {
  constructor() {
    super("Premium post has an invalid price.");
    this.name = "InvalidPremiumPriceError";
  }
}

export class OwnPostUnlockError extends Error {
  constructor() {
    super("You cannot unlock your own post.");
    this.name = "OwnPostUnlockError";
  }
}
