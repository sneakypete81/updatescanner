from clickshot.matchers import visible, eventually_visible
from hamcrest import assert_that, is_
from pynput import keyboard
import pytest

from helpers import wait_until
from regions.content import content
from regions.debug_info import debug_info
from regions.page_settings import page_settings
from regions.page_view import page_view
from regions.sidebar import sidebar


@pytest.mark.usefixtures("firefox")
class TestPageView:
    def test_page_settings_can_be_opened(self):
        sidebar.updatescanner_website_item.click()
        page_view.settings_button.click()
        page_view.page_settings_menu_item.click()

        assert_that(page_settings.updatescanner_website, is_(eventually_visible()))

    def test_debug_info_can_be_opened(self):
        sidebar.updatescanner_website_item.click()
        page_view.settings_button.click()
        page_view.debug_info_menu_item.click()

        assert_that(debug_info.title, is_(eventually_visible()))

    def test_page_settings_can_adjust_parameters(self):
        sidebar.updatescanner_website_item.click()
        page_view.settings_button.click()
        page_view.page_settings_menu_item.click()

        page_settings.autoscan_often.click()
        left_ten_times()
        page_settings.change_threshold_low.click()
        left_ten_times()

        page_settings.ok_button.click()

        page_view.settings_button.click()
        page_view.debug_info_menu_item.click()

        assert_that(debug_info.title, is_(eventually_visible()))
        assert_that(debug_info.scan_rate_minutes_5, is_(visible()))
        assert_that(debug_info.change_threshold_0, is_(visible()))

    def test_links_work_in_pages(self):
        sidebar.updatescanner_website_item.click()
        content.updatescanner_website_install_link.click()

        assert_that(content.amo_website_page, is_(eventually_visible()))

    def test_clicking_title_loads_source_website(self, firefox):
        sidebar.updatescanner_website_item.click()
        page_view.updatescanner_title.click()

        wait_until(
            firefox.get_current_url,
            equals="https://sneakypete81.github.io/updatescanner/",
            timeout_seconds=30,
        )


def left_ten_times():
    kbd = keyboard.Controller()
    for _ in range(10):
        kbd.press(keyboard.Key.left)
        kbd.release(keyboard.Key.left)
