#!/usr/bin/python
from Cheetah.Template import Template
import os
import shutil

testing = True
english_only = True

valid_locales = ["zh-CN",
           "cs-CZ",
           "da-DK",
           "nl-NL",
           "en-US",
           "fi-FI",
           "fr-FR",
           "de-DE",
           "hu-HU",
           "it-IT",
           "ko-KR",
           "pt-BR",
           "ru-RU",
           "sk-SK",
           "es-ES",
           "tr-TR",
           ]
if english_only:
    valid_locales = ["en-US"]

if testing:
    outputPath = '../../../www/testing'
else:
    outputPath = '../../www'

tmpFile = "~temp_build_www.html"

def parseLocales(localePath):
    locales = {}
    for locale in os.listdir(localePath):
        if locale == "CVS" or not os.path.isdir(os.path.join(localePath,locale)): 
            continue

        if locale not in valid_locales:
            continue
 
        locales[locale] = {}
        valid_locale = False
        for propFile in os.listdir(os.path.join(localePath,locale)):
            file = os.path.join(localePath,locale,propFile)
            if propFile == "index.properties":
                valid_locale = True
            if os.path.isfile(file) and propFile != 'contents.rdf' and propFile[0] != '.' and propFile[0] != '~' and propFile[-1] != '~':
                locales[locale][propFile.split(".")[0]] = parsePropFile(file)

        if not valid_locale:        # Delete the locale if there's no index
            del locales[locale]
    return locales

def parsePropFile(propFile):
    results = {}
    f = open(propFile)
    for line in f:
        if len(line.strip()) > 0 and line.strip()[0] != "#" :
            splitLine = line.split("=",1)
            results[splitLine[0]]=splitLine[1].strip()
    f.close()

    htmlFile = os.path.splitext(os.path.basename(propFile))[0]+".html"
    if htmlFile[0] != '_':
        results["_filename"] = htmlFile
    
    return results

def extractLanguages(locales):
# The language name of each locale is in the _header properties file
    languages = []
    for locale in locales.values():
        localePath = locale['_header']['_localePath']
        language = locale['_header']['_language']
#        language = language.decode("utf-8").encode("ascii", "xmlcharrefreplace")
        languages.append({'path'       : localePath,
                          'name'       : language,
                          'translator' : locale['_header']['_translator']})
    # Sort by language name
    languages.sort(cmp=lambda x,y: cmp(x['name'], y['name']))
    return languages

def loadTemplates(templatePath):
    templates={}
    for templateFile in os.listdir(templatePath):
        # Template files starting with _ are included in other templates
        # (no need to load manually)
        if templateFile[0] == "_" or templateFile[0] == '~' or templateFile[0] == '.' or templateFile[-1] == '~' or os.path.isdir(os.path.join(templatePath,templateFile)): 
            continue

        f = open(os.path.join(templatePath,templateFile))
        templates[templateFile.split(".")[0]] = f.read()
        f.close()
    return templates

def getImgPaths(imgPath, localePath):
# returns a dict of images, and paths to the translated image.
# if there is no translated image available, the english path is returned
# eg: {'test_image':'../img/es/test_image.png'}
    imgPaths={}
    # first get the english image paths
    for file in os.listdir(os.path.join(imgPath)):
        if os.path.isfile(os.path.join(imgPath,file)):
            imgPaths.update({os.path.splitext(file)[0]:"../img/"+file})
    # now override with the translated image paths
    try:
        for file in os.listdir(os.path.join(imgPath,localePath)):
            if os.path.isfile(os.path.join(imgPath,localePath,file)):
                imgPaths.update({os.path.splitext(file)[0]:"../img/"+localePath+"/"+file})
    except: 
        pass
    return imgPaths

def cpIfChanged(srcFile, destFile):
# Copies srcFile to destFile only if they are different
    f = open(srcFile, "r")
    srcData = f.read()
    f.close()
    try:
        f = open(destFile, "r")
        destData = f.read()
        f.close()
    except:
        destData = ""
    if srcData != destData:
        shutil.copyfile(srcFile, destFile)

locales = parseLocales("locale")
languages = extractLanguages(locales)
templates = loadTemplates("content")

for localeName, locale in locales.iteritems():
    print "Processing Locale %s" %(localeName)
    
    # Property files starting with "_" are applied globally
    globalProps = {'_languages':languages}
    for propFile, props in locale.iteritems():
        if propFile[0] == "_":
            globalProps.update(props)

    # Get the image paths for this locale
    globalProps.update({'_img':getImgPaths(outputPath+"/img", 
                       globalProps["_localePath"])})

    for templateName, template in templates.iteritems():
        outFile = os.path.join(globalProps["_localePath"],
                                  templateName+".html")
        print "  %s" %(outFile)
        f=open(tmpFile, "w")
        print >> f, Template(template, searchList=[globalProps, locale[templateName]])
        f.close()
        cpIfChanged(tmpFile, os.path.join(outputPath, outFile))

    # Create a local.conf file for this locale
    # to provide translated error pages
    outFile = os.path.join(globalProps["_localePath"], "local.conf")
    print "  %s" %(outFile)
    f = open(tmpFile, "w")
    print >> f, """
<?php
$local_conf_serve_as_is=ON;
$local_conf_commits=OFF;
$local_conf_use_local_error_pages=ON;
$local_conf_error_page='%s/not_found.html'
?>
"""% (globalProps["_localePath"])    
    f.close()
    cpIfChanged(tmpFile, os.path.join(outputPath, outFile))

if testing:    
    print "*** TESTING build done. ***"
else:
    print "*** Live build done. ***"

os.remove(tmpFile)
