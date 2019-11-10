from clickshot import Region, ElementConfig

from .config import config

page_view = Region("page_view", config).configure([
    ElementConfig(
        "settings_button",
        expected_rect=(1978, 227, 40, 38),
    ),
    ElementConfig(
        "page_settings_menu_item",
        expected_rect=(1719, 334, 180, 36),
    ),
])
