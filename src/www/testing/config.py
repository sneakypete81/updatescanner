#!/usr/bin/env python
# coding=UTF-8

app = 'updatescan_www'
name = 'Update Scanner Web Pages'
description = "Web pages for the Update Scanner extension. Note that this isn't actually an extension, just a placeholder for webpage translations on babelzilla"
author = 'Pete Burgers'
translators = []
authorURL = "http://updatescanner.mozdev.org"
uid = '093dbef3-87da-4d49-9836-b717b8196cb1'

major_version = 0
minor_version = 0
revision_version = 3
build_version = False
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

overlays = ()
stylesheets = ()
skins = {}
locales = {
    'cs-CZ': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'da-DK': {
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
    'ko-KR': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'nl-NL': {
        'locale_version': '1.0',
        'display_name': name,
    },
    'pl-PL': {
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

