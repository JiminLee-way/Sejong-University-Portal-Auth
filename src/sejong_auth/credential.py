import os
from abc import ABC, abstractmethod


class CredentialProvider(ABC):
    @abstractmethod
    async def get_credentials(self) -> tuple[str, str]: ...


class StaticCredentialProvider(CredentialProvider):
    def __init__(self, username: str, password: str) -> None:
        self._username = username
        self._password = password

    async def get_credentials(self) -> tuple[str, str]:
        return self._username, self._password


class EnvCredentialProvider(CredentialProvider):
    def __init__(
        self,
        username_var: str = "SEJONG_USERNAME",
        password_var: str = "SEJONG_PASSWORD",
    ) -> None:
        self._username_var = username_var
        self._password_var = password_var

    async def get_credentials(self) -> tuple[str, str]:
        username = os.environ.get(self._username_var)
        password = os.environ.get(self._password_var)
        if not username or not password:
            missing = []
            if not username:
                missing.append(self._username_var)
            if not password:
                missing.append(self._password_var)
            raise ValueError(
                f"Environment variable(s) not set: {', '.join(missing)}"
            )
        return username, password
