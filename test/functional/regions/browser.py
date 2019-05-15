from .element import Element
from . import config

region = tuple([
    item * config.SCREENSHOT_SCALING for item in config.BROWSER_REGION])

update_scanner_button = Element(
    'browser-update_scanner_button',
    region,
    expected_rect=(1907, 122, 128, 64),
    click_offset=(-40, 0))
