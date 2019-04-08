# Release Checklist

* Run `npm run all` and manually test the generated ZIP file
* Update `strict_min_version` in `src/manifest.js`, if required

* Update `CHANGELOG.md`
* Run `npm run bump`
* *BETA ONLY:* Run `npm run sign`
* Push to Github

* Run `npm run release`

* *BETA Only:* Hide the previous comment at https://github.com/sneakypete81/updatescanner/issues/36

* *NON-BETA ONLY:* Upload to AMO - **Be sure to select the correct hosting option:**
  <https://addons.mozilla.org/en-US/developers/addon/update-scanner/versions/submit/distribution?channel=listed>
