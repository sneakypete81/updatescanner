from clickshot import Region, ElementConfig

from .config import config

page_settings = Region("page_settings", config).configure([
    ElementConfig(
        "title",
        expected_rect=(846, 322, 326, 72),
    ),
    ElementConfig(
        "ok_button",
        expected_rect=(1485, 1051, 134, 51),
    ),
])
