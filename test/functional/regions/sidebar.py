from clickshot import Region, ElementConfig

from .config import config

sidebar = Region("sidebar", config).configure([
    ElementConfig(
        "title",
        expected_rect=(18, 213, 395, 48),
    ),
    ElementConfig(
        "close_button",
        expected_rect=(18, 213, 395, 48),
        click_offset=(164, 0),
    ),
    ElementConfig(
        "updatescanner_website_item",
        expected_rect=(41, 291, 323, 29),
    ),
])
