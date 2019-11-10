import pytest
from hamcrest import assert_that, is_
from clickshot.matchers import visible, eventually_visible

from regions.browser import browser
from regions.popup import popup
from regions.sidebar import sidebar
from regions.page_settings import page_settings


@pytest.mark.usefixtures("firefox")
class TestPopup:
    def test_has_a_toolbar_button(self):
        assert_that(browser.updatescanner_button, is_(visible()))

    def test_popup_is_shown_when_the_toolbar_button_is_clicked(self):
        browser.updatescanner_button.click()

        assert_that(popup.empty_popup, is_(eventually_visible()))

    def test_sidebar_can_be_opened_from_the_popup(self):
        sidebar.close_button.click()
        browser.updatescanner_button.click()

        popup.open_sidebar_button.click()

        assert_that(sidebar.title, is_(eventually_visible()))

    def test_item_can_be_added_from_the_popup(self, firefox):
        firefox.navigate_to("https://time.is")
        browser.updatescanner_button.click()

        popup.add_button.click()
        page_settings.ok_button.click()

        assert_that(sidebar.time_is_website_item, is_(eventually_visible()))
