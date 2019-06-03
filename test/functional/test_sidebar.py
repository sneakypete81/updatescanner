import pytest
from hamcrest import assert_that, is_
from clickshot.matchers import eventually_visible

from regions.sidebar import sidebar
from regions.content import content


@pytest.mark.usefixtures("firefox")
class TestSidebar:
    def test_sidebar_is_open_after_addon_install(self):
        assert_that(sidebar.title, is_(eventually_visible()))

    def test_clicking_an_item_opens_it(self):
        sidebar.updatescanner_website_item.click()

        assert_that(
            content.updatescanner_website_page, is_(eventually_visible()))
