class SejongAuthError(Exception):
    """Base exception for sejong-auth."""


class LoginFailedError(SejongAuthError):
    """Raised when login fails due to invalid credentials."""


class SessionExpiredError(SejongAuthError):
    """Raised when session is expired or login() was not called."""


class NetworkError(SejongAuthError):
    """Raised on connection failure, timeout, or DNS error."""


class PortalError(SejongAuthError):
    """Raised when portal returns unexpected HTTP status."""


class ParseError(SejongAuthError):
    """Raised when JSON response structure has changed."""
