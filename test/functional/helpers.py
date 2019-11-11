from datetime import datetime, timedelta
import time


def wait_until(function, args=[], equals=True, timeout_seconds=30, poll_seconds=0.1):
    start_time = datetime.now()
    while function(*args) != equals:
        if datetime.now() - start_time > timedelta(seconds=timeout_seconds):
            raise AssertionError(
                f"Timed out waiting for {function} to return {equals}"
            )
        time.sleep(poll_seconds)
