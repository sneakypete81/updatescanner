from clickshot import Region
from hamcrest import assert_that, starts_with
from urllib.parse import urlsplit, urlunsplit

from .config import config


class Debug(Region):
    @staticmethod
    def navigate_from_current(firefox):
        base_url = firefox.get_current_url()
        assert_that(base_url, starts_with("moz-extension://"))

        split_url = urlsplit(base_url)._replace(
            path="/app/debug/debug.html",
            query="",
        )
        firefox.navigate_to(urlunsplit(split_url))


debug = Debug("debug", config)
