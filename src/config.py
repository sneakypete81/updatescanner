#!/usr/bin/env python

app = 'updatescan'
name = 'Update Scanner'
description = 'Monitors webpages for updates'
author = 'Pete Burgers'
authorURL = "http://updatescanner.mozdev.org"
uid = 'c07d1a49-9894-49ff-a594-38960ede8fb9'

major_version = 1
minor_version = 0
build_version = 6
in_development = False

version = "%d.%d.%d%s" % (
    major_version,
    minor_version,
    build_version,
    in_development and "+" or ""
)

homepageURL = "http://updatescanner.mozdev.org"

allowUpdate = False
updateURL = "%(homepageURL)s/update.rdf" % vars()
updateFile = "%(app)s-%(version)s.xpi" % vars()
updateLink = "%(homepageURL)s/%(updateFile)s" % vars()
iconPath = "skin/updatescan_big.png"

firefoxUID = 'ec8030f7-c20a-464f-9b0e-13a3a9e97384'
firefoxMinVersion = '1.5'
firefoxMaxVersion = '2.0.0.*'

overlays = (
    # overlay this on that
    ('%(app)s/content/browser.xul' % vars(), 'browser/content/browser.xul' % vars()),
)
stylesheets = (
    # overlay this on that
    ('%(app)s/skin/updatescanoverlay.css' % vars(), 'global/content/customizeToolbar.xul' % vars()),
)

skins = {
    'classic': {
        'skin_version': '1.0',
        'display_name': name,
    },
}

locales = {
    'en-US': {
        'locale_version': '1.0',
        'display_name': 'English (US)',
    },
}

