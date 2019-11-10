from clickshot import Region, ElementConfig

from .config import config

browser = Region("browser", config).configure([
    ElementConfig(
        "updatescanner_button",
        expected_rect=(1907, 122, 128, 64),
        click_offset=(-40, 0),
    ),
])
