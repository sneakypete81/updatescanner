# Release Checklist

* Run `npm install`
* Run `npm run all` and manually test the generated ZIP file
* Update `strict_min_version` in `src/manifest.js`, if required

* Update `CHANGELOG.md`
* Run `npm run bump`
* *BETA ONLY:* Run `npm run sign`
* Push to Github

* Run `npm run release`

* *BETA Only:* Hide the previous comment at <https://github.com/sneakypete81/updatescanner/issues/36>

* *NON-BETA ONLY:* Upload to AMO - **Be sure to select the correct hosting option:**
  <https://addons.mozilla.org/en-US/developers/addon/update-scanner/versions/submit/distribution?channel=listed>

---

## Manual Release Tests

Test using Win10 x64 with the latest (non-Beta) Firefox.

### Startup

* Create a fresh profile and install the release candidate.
* Check that the sidebar is opened automatically.
* Click the website sidebar item, check that it displays.

### Page View

* Visit <https://time.is> and add it using the popup.
* Go to "Page Settings" and set Scan=5min, Threshold=All.
* Check that a link works on the change view, then go back.
* Click the title, then go back.
* Wait for a change then click the notification.
* Check the Old/New/Changes dropdown.
* Check the Debug Info.

### Sidebar

* Right-click the TimeIs page in the sidebar and Scan Now.
* Right-click the TimeIs page in the sidebar, choose Settings, and change its title.
* Create a subfolder and put both pages into it. Check that the subfolder is bold.
* Click the TimeIs item. Check that the bold goes away.
* Right-click the subfolder and Scan Now.
* Right-click the subfolder and add a new page with an invalid URL (eg. <https://testign.com>).
* Right-click the new page and Scan Now. It should turn grey.
* Click the new page, and check it says "This page returned an error".
* Right-click the new page and Delete it.

### Popup

* Close the sidebar, open the popup, and click the sidebar button.
* Open the popup and click the TimeIs item.
* Open the popup and Scan All Pages.
* Open the popup and Show All Updates.
* Open the popup and click Help.
* Open the popup and backup pages.
* Open the popup and restore pages.
* Open the popup and Scan All Pages. Notification should say "No updates".
* Move the button to the overflow menu, check that the popup still looks ok, including backup/restore panes.

### Upgrade

* Delete and regenerate the profile.
* Install the previous US release.
* Create a subfolder and put the website page into it.
* Upgrade to the release candidate.
* Click the website page and check that it opens.
