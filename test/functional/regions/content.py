from clickshot import Region, ElementConfig

from .config import config

content = Region("content", config).configure([
    ElementConfig(
        "updatescanner_website_page",
        expected_rect=(587, 486, 1070, 253),
    ),
])
