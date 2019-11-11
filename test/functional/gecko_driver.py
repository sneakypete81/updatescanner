import requests

GET = "get"
POST = "post"
DELETE = "delete"


class GeckoDriver:
    def __init__(self, base_uri):
        self.base_uri = base_uri
        self.session_id = None

    def new_session(self):
        assert self.session_id is None
        data = self._request(POST, "session", {})
        self.session_id = data['sessionId']

    def delete_session(self):
        assert self.session_id is not None
        self._request(DELETE, make_path("session", self.session_id), {})
        self.session_id = None

    def install_addon(self, path):
        assert self.session_id is not None
        id = self._request(
            POST,
            make_path("session", self.session_id, "moz", "addon", "install"),
            {"path": path, "temporary": True},
        )
        return id

    def uninstall_addon(self, id):
        assert self.session_id is not None
        self._request(
            POST,
            make_path("session", self.session_id, "moz", "addon", "uninstall"),
            {"id": id}
        )

    def set_window_rect(self, x=None, y=None, width=None, height=None):
        assert self.session_id is not None
        self._request(
            POST,
            make_path("session", self.session_id, "window", "rect"),
            {"x": x, "y": y, "width": width, "height": height}
        )

    def navigate_to(self, url):
        assert self.session_id is not None
        self._request(
            POST,
            make_path("session", self.session_id, "url"),
            {"url": url}
        )

    def get_current_url(self):
        assert self.session_id is not None
        return self._request(
            GET,
            make_path("session", self.session_id, "url"),
            {}
        )

    def _request(self, method, endpoint, data):
        resp = requests.request(
            method,
            make_path(self.base_uri, endpoint),
            json=data,
        )
        return self._process_resp(resp)["value"]

    @staticmethod
    def _process_resp(resp):
        if resp.status_code != 200:
            try:
                print(resp.json()['value'])
            except Exception:
                pass
            raise resp.raise_for_status()
        return resp.json()


def make_path(*parts):
    return "/".join(parts)
