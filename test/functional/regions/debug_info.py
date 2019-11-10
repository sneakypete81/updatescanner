from clickshot import Region, ElementConfig

from .config import config

debug_info = Region("debug_info", config).configure([
    ElementConfig(
        "title",
        expected_rect=(1098, 235, 314, 59),
    ),
    ElementConfig(
        "scan_rate_minutes_5",
        expected_rect=(508, 380, 326, 25),
    ),
    ElementConfig(
        "change_threshold_0",
        expected_rect=(506, 406, 338, 28),
    ),
])
