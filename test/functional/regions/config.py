# Screenshots are taken with a 2x zoom
SCREENSHOT_SCALING = 2

# Location and size of the browser window
BROWSER_REGION = (0, 0, 1024, 600)

BROWSER_SCREENSHOT_REGION = tuple(
    [a * SCREENSHOT_SCALING for a in BROWSER_REGION]
)
