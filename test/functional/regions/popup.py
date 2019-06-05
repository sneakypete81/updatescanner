from clickshot import Region, ElementConfig

from .config import config

popup = Region("popup", config).configure([
    ElementConfig(
        "empty_popup",
        expected_rect=(1460, 188, 520, 780),
    ),
    ElementConfig(
        "open_sidebar_button",
        expected_rect=(1664, 836, 100, 112),
    ),
    ElementConfig(
        "add_button",
        expected_rect=(1462, 820, 151, 145),
    )
])
