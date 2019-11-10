from clickshot import Region, ElementConfig

from .config import config

page_settings = Region("page_settings", config).configure([
    ElementConfig(
        "title",
        expected_rect=(846, 322, 326, 72),
    ),
    ElementConfig(
        "updatescanner_website",
        expected_rect=(834, 310, 812, 825),
    ),
    ElementConfig(
        "autoscan_often",
        expected_rect=(921, 673, 146, 48),
    ),
    ElementConfig(
        "change_threshold_low",
        expected_rect=(917, 825, 144, 53),
    ),
    ElementConfig(
        "ok_button",
        expected_rect=(1485, 1051, 134, 51),
    ),
])
