from pathlib import Path
import time

import pyautogui

IMAGE_DIR = Path(__file__).parent / "images"
SCREENSHOT_DIR = Path(__file__).parent / "screenshots"


class Element:
    def __init__(self, name, region, click_offset=None):
        self.name = name
        self.image_path = (IMAGE_DIR / name).with_suffix(".png")
        self.scaled_region = tuple([item * 2 for item in region])

        if click_offset is None:
            click_offset = (0, 0)
        self.click_offset = click_offset

        self._last_screenshot = None

    def __str__(self):
        return "<Element name='{}'>".format(self.name)

    def click(self):
        try:
            x, y = self._locate_center_on_screen()
        except Exception:
            self.save_last_screenshot()
            raise

        pyautogui.click(
            x/2 + self.click_offset[0],
            y/2 + self.click_offset[1])

    def is_visible(self, timeout_seconds=0):
        start_time = time.monotonic()

        while True:
            try:
                self._locate_center_on_screen()
                return True

            except ElementNotFoundError:
                if time.monotonic() - start_time > timeout_seconds:
                    return False

    def _locate_center_on_screen(self):
        screenshot = pyautogui.screenshot(region=self.scaled_region)
        self._last_screenshot = screenshot

        result = pyautogui.locate(str(self.image_path), screenshot)
        if result is None:
            raise ElementNotFoundError(self)

        return pyautogui.center(result)

    def save_last_screenshot(self):
        SCREENSHOT_DIR.mkdir(exist_ok=True)
        screenshot_path = self._find_unique_screenshot_path()
        self._last_screenshot.save(screenshot_path)

        print("Expected Image: {}".format(self.image_path))
        print("Screenshot: {}".format(screenshot_path))

    def _find_unique_screenshot_path(self):
        prefix = SCREENSHOT_DIR / self.name
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
