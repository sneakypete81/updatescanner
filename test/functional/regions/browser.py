from .element import Element
from . import config

region = tuple([
    item * config.SCREENSHOT_SCALING for item in config.BROWSER_REGION])

browser = Element(
    'browser', region)
update_scanner_button = Element(
    'update_scanner_button',
    region,
    expected_rect=(1907, 122, 128, 64),
    click_offset=(-40, 0))
empty_popup = Element(
    'empty_popup',
    region,
    expected_rect=(1460, 188, 520, 780))
