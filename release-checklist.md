# Release Checklist

 * Update the `version` field in `src/manifest.js`
 * Update `strict_min_version` too, if required
 * Run `npm run all` and manually test the generated ZIP file


 * *BETA ONLY:* Add an entry to `updates.json`
 * *BETA ONLY:* Run `npm run sign`


 * Commit, tag and push to Github
 * Create a release on Github
 * *BETA ONLY:* Include the signed XPI with the release, and ensure it ends in
   `-an.fx.xpi` (`+` replaced by `.`)
 * *BETA ONLY:* Update the [Beta Testers Wanted](
   https://github.com/sneakypete81/updatescanner/issues/36) issue


 * *NON-BETA ONLY:* Upload to AMO - **Be sure to select the correct hosting option:**
