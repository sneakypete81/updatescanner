from .element import Element


region = (0, 0, 1024, 600)

browser = Element(
    'browser', region)
update_scanner_button = Element(
    'update_scanner_button', region, click_offset=(-20, 0))
empty_popup = Element(
    'empty_popup', region)
