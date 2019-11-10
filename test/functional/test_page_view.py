import pytest
from hamcrest import assert_that, is_
from clickshot.matchers import eventually_visible

from regions.sidebar import sidebar
from regions.page_settings import page_settings
from regions.page_view import page_view


@pytest.mark.usefixtures("firefox")
class TestPageView:
    def test_page_settings_can_be_opened(self):
        sidebar.updatescanner_website_item.click()
        page_view.settings_button.click()
        page_view.page_settings_menu_item.click()

        assert_that(page_settings.update_scanner_website, is_(eventually_visible()))


    # def test_page_settings_can_adjust_parameters(self):
    #     sidebar.updatescanner_website_item.click()
