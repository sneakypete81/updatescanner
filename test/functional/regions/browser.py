from clickshot import Region, ElementConfig

from .config import config

browser = Region("browser", config).configure([
    ElementConfig("updatescanner_button", click_offset=(-20, 0)),
])
