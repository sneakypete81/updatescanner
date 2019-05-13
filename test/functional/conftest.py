import pytest
from pathlib import Path

from gecko_driver import GeckoDriver
from regions import browser

BASE_URI = "http://localhost:4444"
ADDON_PATH = Path(__file__).parent.parent.parent / "src"


@pytest.fixture()
def firefox(_gecko_session):
    addon_id = _gecko_session.install_addon(str(ADDON_PATH))
    yield

    _gecko_session.uninstall_addon(addon_id)


@pytest.fixture(scope="session")
def _gecko_session():
    gecko = GeckoDriver(BASE_URI)
    gecko.new_session()
    try:
        gecko.set_window_rect(*browser.region)
        yield gecko

    finally:
        gecko.delete_session()
