#!/usr/bin/env python
# coding=UTF-8

app = 'updatescan'
name = 'Update Scanner'
description = 'Monitors webpages for updates'
author = 'Pete Burgers'
translators = ['SlovakSoft (Slovenčina)',
               'Almotasim (Italiano)',
               'myahoo (Français)',
               'Mark Heijl (Nederlands)',
               'Proyecto Nave (Español)',
               'jeongsw (Korean)',
               'Team erweiterungen.de (Deutsch)',
               'JZsolt (Magyar)',
               'Edvard Borovskij (Russian)',
               'Leszek(teo)Życzkowski (Polski)',
               'PetrTwo (Čeština)'
               'Raryel Costa Souza (português brasileiro)']
authorURL = "http://updatescanner.mozdev.org"
uid = 'c07d1a49-9894-49ff-a594-38960ede8fb9'

major_version = 2
minor_version = 0
revision_version = 14
build_version = 2
in_development = False
if build_version:
    version = "%d.%d.%d.%d%s" % (
        major_version,
        minor_version,
        revision_version,
        build_version,
        in_development and "+" or ""
    )
else:
    version = "%d.%d.%d%s" % (
        major_version,
        minor_version,
        revision_version,
        in_development and "+" or ""
    )

homepageURL = "http://updatescanner.mozdev.org"

allowUpdate = False
updateURL = "%(homepageURL)s/update.rdf" % vars()
updateFile = "%(app)s-%(version)s.xpi" % vars()
updateLink = "%(homepageURL)s/%(updateFile)s" % vars()
iconPath = "skin/updatescan_big.png"

firefoxUID = 'ec8030f7-c20a-464f-9b0e-13a3a9e97384'
firefoxMinVersion = '2.0'
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
    'cs-CZ': {
        'locale_version': '1.0',
        'display_name': name,
    },                      
    'de-DE': {
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
    'fr-FR': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'hu-HU': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'it-IT': {
        'locale_version': '1.0',
        'display_name': name,
    },
#    'ja-JP': {
#        'locale_version': '1.0',
#        'display_name': name,
#    },
    'ko-KR': {
        'locale_version': '1.0',
        'display_name': name,
    },
#    'ms-MY': {
#        'locale_version': '1.0',
#        'display_name': name,
#    },
    'nl-NL': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'pt-BR': {
        'locale_version': '1.0',
        'display_name': name,
    },    
    'pl-PL': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'ru-RU': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'sk-SK': {
        'locale_version': '1.0',
        'display_name': name,
    },
#    'tr-TR': {
#        'locale_version': '1.0',
#        'display_name': name,
#    },
}

