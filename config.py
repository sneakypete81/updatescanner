#!/usr/bin/env python
# coding=UTF-8

import sys

version = "3.2.0" # Don't forget to update upgrade.js too!
publish_babelzilla = False # True = include incomplete locales for babelzilla
only_english = False # True = only include english for beta releases


app = 'updatescan'
name = 'Update Scanner'
description = 'Monitors webpages for updates'
author = 'Pete Burgers'
contributors = ['Karol Misiura (Tango Desktop Project Icons)']
translators = ['stoyan (български език)',
               'PetrTwo (Čeština)',
               'Jørgen (Dansk)',
               '123tp (Dansk)',
               'Archaeopteryx (Deutsch)'
               'Team erweiterungen.de (Deutsch)',
               'Proyecto Nave (Español)',
               'Chuzo (Español)',
               'Olli (Suomeksi)',
               'myahoo (Français)',
               'JZsolt (Magyar)',
               'Almotasim (Italiano)',
               '藤本理弘 (日本語)',
               'Jeong Seungwon (한국어)',
               'Edvard (Funalien) Borovskij (lietuvių kalba)',
               'Lauriote (lietuvių kalba)',
               'Mark Heijl (Nederlands)',
               'Leszek (teo) Życzkowski (Polski)',
               'Raryel Costa Souza (português brasileiro)',
               'Edgard Dias Magalhães (português brasileiro)',
               'Edvard (Funalien) Borovskij (Русский)',
               'Slovak Team (Slovenčina)',
               'Mikael Hiort af Ornäs (Svenska)',
               'Kenan Balamir (Türkçe)',
               'Wang King (简化字 - zh-CN)',
               'Peter Pin-Guang Chen (簡化字 - zh-TW)',
               ]
authorURL = "http://sneakypete81.github.io/updatescanner/"
uid = 'c07d1a49-9894-49ff-a594-38960ede8fb9'
optionsChrome = 'chrome://updatescan/content/preferences.xul'

if len(sys.argv) > 1 and sys.argv[1] == "dev":
    in_development = True
else:
    in_development = False

if in_development:
    version = version + "+"

homepageURL = "http://sneakypete81.github.io/updatescanner/"

allowUpdate = False
updateURL = "%(homepageURL)s/update.rdf" % vars()
updateFile = "%(app)s-%(version)s.xpi" % vars()
updateLink = "%(homepageURL)s/%(updateFile)s" % vars()

firefoxUID = 'ec8030f7-c20a-464f-9b0e-13a3a9e97384'
firefoxMinVersion = '32.0'
firefoxMaxVersion = '32.0'

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
        'extras': [{'os_code': '', 'os_path': 'linux'},
                   {'os_code': 'os=WINNT', 'os_path': 'win'},
                   {'os_code': 'os=Darwin', 'os_path': 'win'}, # Mac can use Windows icons
                   ],
    },
}

locales = {
    'bg-BG': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'cs': {
        'locale_version': '1.0',
        'display_name': name,
    },                      
    'da': {
        'locale_version': '1.0',
        'display_name': name,
    },           
    'de': {
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
    'it-IT': {
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
    'lt-LT': {
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
    'ru-RU': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'sk-SK': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'sv-SE': {
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
    'zh-TW': {
        'locale_version': '1.0',
        'display_name': name,
    },
}

incomplete_locales = {
    'ms-MY': {
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
