from .element import Element

title = Element(
    'sidebar-title',
    expected_region=(18, 213, 395, 48))

close_button = Element(
    'sidebar-close_button',
    expected_region=(18, 213, 395, 48),
    click_offset=(164, 0))

updatescanner_website_item = Element(
    'sidebar-updatescanner_website_item',
    expected_region=(41, 291, 323, 29),
    post_click_delay_seconds=2)
