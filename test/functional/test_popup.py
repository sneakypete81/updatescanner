import time
import pytest
from hamcrest import assert_that, is_

from matchers import visible, eventually_visible
from regions import browser, popup, sidebar


@pytest.mark.usefixtures("firefox")
class TestPopup:
    def test_has_a_toolbar_button(self):
        assert_that(browser.update_scanner_button, is_(visible()))

    def test_popup_is_shown_when_the_toolbar_button_is_clicked(self):
        browser.update_scanner_button.click()
        time.sleep(0.5)

        assert_that(popup.empty_popup, is_(eventually_visible()))
