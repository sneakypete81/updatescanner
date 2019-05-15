from pathlib import Path

IMAGE_DIR = Path(__file__).parent / "images"
SCREENSHOT_DIR = Path(__file__).parent / "screenshots"

# Screenshots are taken with a 2x zoom
SCREENSHOT_SCALING = 2

# Location and size of the browser window
BROWSER_REGION = (0, 0, 1024, 600)

BROWSER_SCREENSHOT_REGION = tuple(
    [a * SCREENSHOT_SCALING for a in BROWSER_REGION]
)

WARN_FOR_DELAYED_DETECTIONS = False


def warn_for_delayed_detections(value):
    global WARN_FOR_DELAYED_DETECTIONS
    WARN_FOR_DELAYED_DETECTIONS = value
