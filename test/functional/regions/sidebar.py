from clickshot import Region, ElementConfig

from .config import config

sidebar = Region("sidebar", config).configure([
    ElementConfig("close_button", click_offset=(86, 0)),
])
