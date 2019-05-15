from .element import Element
from . import config

region = tuple([
    item * config.SCREENSHOT_SCALING for item in config.BROWSER_REGION])

empty_popup = Element(
    'popup-empty_popup',
    region,
    expected_rect=(1460, 188, 520, 780))

open_sidebar_button = Element(
    'popup-open_sidebar_button',
    region,
    expected_rect=(1664, 836, 100, 112))
