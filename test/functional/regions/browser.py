import pyautogui
from clickshot import Region, ElementConfig

from .config import config


class Browser(Region):
    @staticmethod
    def visit_url(url):
        pyautogui.hotkey("command", "l")
        pyautogui.typewrite(url)
        pyautogui.press("enter")


browser = Browser("browser", config).configure([
    ElementConfig(
        "update_scanner_button",
        expected_rect=(1907, 122, 128, 64),
        click_offset=(-40, 0),
    ),
])
