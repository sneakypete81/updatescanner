import time
import warnings

import pyautogui

from . import config

CLICK_RETRY_SECONDS = 10


class Element:
    def __init__(self, name, expected_region=None,
                 click_offset=None, post_click_delay_seconds=None):
        self.name = name
        self.image_path = (config.IMAGE_DIR / name).with_suffix(".png")
        self.expected_region = expected_region

        if click_offset is None:
            click_offset = (0, 0)
        self.click_offset = click_offset
        self.post_click_delay_seconds = post_click_delay_seconds

        self._last_screenshot = None

    def __str__(self):
        return "<Element name='{}'>".format(self.name)

    def click(self, timeout_seconds=CLICK_RETRY_SECONDS):
        try:
            x, y = self._locate_centre_with_retry(timeout_seconds)
        except Exception:
            self.save_last_screenshot()
            raise

        pyautogui.click(
            (x + self.click_offset[0]) // config.SCREENSHOT_SCALING,
            (y + self.click_offset[1]) // config.SCREENSHOT_SCALING)

        if self.post_click_delay_seconds is not None:
            time.sleep(self.post_click_delay_seconds)

    def is_visible(self, timeout_seconds=0):
        try:
            self._locate_centre_with_retry(timeout_seconds)
            return True
        except ElementNotFoundError:
            return False

    def _locate_centre_with_retry(self, timeout_seconds):
        start_time = time.monotonic()
        while True:
            try:
                return self._locate_centre()

            except ElementNotFoundError:
                if time.monotonic() - start_time > timeout_seconds:
                    raise

    def _locate_centre(self):
        if self._location_matches_expected():
            return pyautogui.center(self.expected_region)

        # Element is not where we expected it to be, so search the region
        result = self._locate_in_screen_region()

        if result != self.expected_region:
            warnings.warn(
                "Location of {} {} doesn't match expected {}".format(
                    self.name, tuple(result), self.expected_region))

        return pyautogui.center(result)

    def _location_matches_expected(self):
        if self.expected_region is None:
            return False

        screenshot = pyautogui.screenshot(region=self.expected_region)
        self._last_screenshot = screenshot

        result = pyautogui.locate(str(self.image_path), screenshot)
        return result is not None

    def _locate_in_screen_region(self):
        screenshot = pyautogui.screenshot(
            region=config.BROWSER_SCREENSHOT_REGION)
        self._last_screenshot = screenshot

        result = pyautogui.locate(str(self.image_path), screenshot)
        if result is None:
            raise ElementNotFoundError(self)

        return result

    def save_last_screenshot(self):
        if self._last_screenshot is None:
            return

        config.SCREENSHOT_DIR.mkdir(exist_ok=True)
        screenshot_path = self._find_unique_screenshot_path()
        self._last_screenshot.save(screenshot_path)

        print("Expected Image: {}".format(self.image_path))
        print("Screenshot: {}".format(screenshot_path))

    def _find_unique_screenshot_path(self):
        prefix = config.SCREENSHOT_DIR / self.name
        screenshot_path = prefix.with_suffix(".png")
        if not screenshot_path.exists():
            return screenshot_path

        count = 2
        while True:
            unique_prefix = prefix.with_name(prefix.name + str(count))
            screenshot_path = unique_prefix.with_suffix(".png")
            if not screenshot_path.exists():
                return screenshot_path
            count += 1


class ElementNotFoundError(Exception):
    pass
