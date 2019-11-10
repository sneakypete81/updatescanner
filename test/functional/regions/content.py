from clickshot import Region, ElementConfig

from .config import config

content = Region("content", config).configure([
    ElementConfig(
        "updatescanner_website_page",
        expected_rect=(587, 486, 1070, 253),
    ),
    ElementConfig(
        "updatescanner_website_install_link",
        expected_rect=(1777, 370, 115, 58),
    ),
    ElementConfig(
        "amo_website_page",
        expected_rect=(549, 790, 540, 148),
    ),
])
