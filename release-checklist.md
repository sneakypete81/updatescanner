# Release Checklist

* Run `npm run all` and manually test the generated ZIP file
* Update `strict_min_version` in `src/manifest.js`, if required

* Run `npm run bump`
* *BETA ONLY:* Run `npm run sign`

* Push to Github
* Create a release on Github
* *BETA ONLY:* Attach the signed XPI to the release
* *BETA ONLY:* Update the [Beta Testers Wanted](
  https://github.com/sneakypete81/updatescanner/issues/36) issue

* *NON-BETA ONLY:* Upload to AMO - **Be sure to select the correct hosting option:**
  <https://addons.mozilla.org/en-US/developers/addon/update-scanner/versions/submit/distribution?channel=listed>
