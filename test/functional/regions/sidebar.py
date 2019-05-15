from .element import Element
from . import config

region = tuple([
    item * config.SCREENSHOT_SCALING for item in config.BROWSER_REGION])

close_button = Element(
    'sidebar-close_button',
    region,
    expected_rect=(18, 213, 395, 48),
    click_offset=(164, 0))

title = Element(
    'sidebar-title',
    region,
    expected_rect=(18, 213, 395, 48))
