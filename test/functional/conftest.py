import pytest
from pathlib import Path
import shutil
from werkzeug.wrappers import Response

from gecko_driver import GeckoDriver
from regions import config

BASE_URI = "http://localhost:4444"
ADDON_PATH = Path(__file__).parent.parent.parent / "src"
SCREENSHOT_DIR = Path(__file__).parent / "regions" / "screenshots"


@pytest.fixture()
def firefox(_gecko_session):
    addon_id = _gecko_session.install_addon(str(ADDON_PATH))
    yield _gecko_session

    _gecko_session.navigate_to("about:blank")
    _gecko_session.uninstall_addon(addon_id)


@pytest.fixture(scope="session")
def _gecko_session():
    gecko = GeckoDriver(BASE_URI)
    gecko.new_session()
    try:
        gecko.set_window_rect(*config.BROWSER_REGION)
        yield gecko

    finally:
        gecko.delete_session()


def pytest_sessionstart(session):
    """
    Delete all previous screenshots at the start of the test session
    """
    shutil.rmtree(SCREENSHOT_DIR, ignore_errors=True)


class ChangingWebsite:
    def __init__(self):
        self.serve_count = 0

    def handler(self, request):
        self.serve_count += 1
        return Response(
            response=(
                f"<html>"
                f"<head><title>Changing Website</title></head>"
                f"<body>This page has been served {self.serve_count} times.</body>"
                f"</html>"
            ),
            status=200,
            content_type="text/html",
        )


@pytest.fixture()
def changing_website(httpserver):
    url_path = "/changing"
    httpserver.expect_request(url_path).respond_with_handler(
        ChangingWebsite().handler
    )
    return httpserver.url_for(url_path)
