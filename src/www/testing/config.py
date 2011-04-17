#!/usr/bin/env python
# coding=UTF-8

version = "0.0.5"
in_development = False
publish_babelzilla = False # True = include incomplete locales for babelzilla
only_english = False # True = only include english for beta releases


app = 'updatescan_www'
name = 'Update Scanner Web Pages'
description = "Web pages for the Update Scanner extension. Note that this isn't actually an extension, just a placeholder for webpage translations on babelzilla"
author = 'Pete Burgers'
translators = []
authorURL = "http://updatescanner.mozdev.org"
uid = '093dbef3-87da-4d49-9836-b717b8196cb1'
optionsChrome = ''

if in_development:
    version = version + "+"

homepageURL = "http://updatescanner.mozdev.org"

allowUpdate = False
updateURL = "%(homepageURL)s/update.rdf" % vars()
updateFile = "%(app)s-%(version)s.xpi" % vars()
updateLink = "%(homepageURL)s/%(updateFile)s" % vars()
iconPath = "skin/updatescan_big.png"

firefoxUID = 'ec8030f7-c20a-464f-9b0e-13a3a9e97384'
firefoxMinVersion = '2.0'
firefoxMaxVersion = '2.0.0.*'

overlays = ()
stylesheets = ()
skins = {}
locales = {
    'cs-CZ': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'da': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'en-US': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'es-ES': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'fi-FI': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'fr': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'hu-HU': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'ja-JP': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'ko-KR': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'nl': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'pl': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'pt-BR': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'sk-SK': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'ru-RU': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'tr-TR': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'zh-CN': {
        'locale_version': '1.0',
        'display_name': name,
    },


# Translations only partially complete, but uploaded to website anyway:
    'de': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'it-IT': {
        'locale_version': '1.0',
        'display_name': name,
    },

}

incomplete_locales = {
    # Hasn't been properly converted in Babelzilla from cs-CZ to cs. Ignore cs for now.
    'cs': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'zh-TW': {
        'locale_version': '1.0',
        'display_name': name,
    },
}

# Only include incomplete locales if we're building for babelzilla
if publish_babelzilla:
    print "*** Babelzilla version - includes incomplete locales ***"
    locales.update(incomplete_locales)

if only_english:
    print "*** English-only version - only use for betas! ***"
    locales = {
        'en-US': {'locale_version': '1.0','display_name': name}
        }
