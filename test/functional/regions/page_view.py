from clickshot import Region, ElementConfig

from .config import config

page_view = Region("page_view", config).configure([
    ElementConfig(
        "updatescanner_title",
        expected_rect=(584, 225, 527, 52),
    ),
    ElementConfig(
        "settings_button",
        expected_rect=(1978, 227, 40, 38),
    ),
    ElementConfig(
        "debug_info_menu_item",
        expected_rect=(1715, 284, 153, 34),
    ),
    ElementConfig(
        "page_settings_menu_item",
        expected_rect=(1719, 334, 180, 36),
    ),
])
