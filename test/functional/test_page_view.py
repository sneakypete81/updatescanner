import pytest
from hamcrest import assert_that, is_
from clickshot.matchers import eventually_visible

from regions.sidebar import sidebar
from regions.page_properties import page_properties
from regions.page_view import page_view


@pytest.mark.usefixtures("firefox")
class TestPageView:
    def test_page_settings_can_be_opened(self):
        sidebar.updatescanner_website_item.click()
        page_view.settings_button.click()
        page_view.page_properties_menu_item.click()

        assert_that(page_properties.title, is_(eventually_visible(5)))

    # def test_page_settings_can_adjust_parameters(self):
    #     sidebar.updatescanner_website_item.click()
