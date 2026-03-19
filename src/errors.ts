export class SejongAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SejongAuthError";
  }
}

export class LoginFailedError extends SejongAuthError {
  constructor(message: string = "아이디 또는 비밀번호가 올바르지 않습니다") {
    super(message);
    this.name = "LoginFailedError";
  }
}

export class SessionExpiredError extends SejongAuthError {
  constructor(
    message: string = "Not logged in. Call login() first.",
  ) {
    super(message);
    this.name = "SessionExpiredError";
  }
}

export class NetworkError extends SejongAuthError {
  constructor(message: string = "Connection failed") {
    super(message);
    this.name = "NetworkError";
  }
}

export class PortalError extends SejongAuthError {
  constructor(message: string = "Portal returned unexpected response") {
    super(message);
    this.name = "PortalError";
  }
}

export class ParseError extends SejongAuthError {
  constructor(message: string = "Failed to parse portal response") {
    super(message);
    this.name = "ParseError";
  }
}
