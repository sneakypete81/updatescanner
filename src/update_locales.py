#!/usr/bin/env python

import optparse
import os
import subprocess
import shutil
import tempfile
from post_data import POST_DATA
import config

US_EXTENSION_ID = 4552
WEB_EXTENSION_ID = 4726

EXTENSION_ID = US_EXTENSION_ID

LOG_FILE = "log.txt"
WGET_LOGIN = ["wget", 
              "--output-document=login.html",
              "--append-output=%s" % LOG_FILE,
              "--post-data", POST_DATA,
              "--save-cookies", "cookies.txt",
              "--keep-session-cookies",
              "http://www.babelzilla.org/index.php?option=com_ipblogin&task=login",
              ]
# Command to download locales with missing strings skipped
WGET_DOWNLOAD_SKIP = ["wget",
                      "--quiet",
                      "--append-output=%s" % LOG_FILE,
                      "--output-document=locales_skip.tar.gz",
                      "--load-cookies", "cookies.txt",
                      "--content-disposition",
                      "http://www.babelzilla.org/index.php?option=com_wts"+
                      "&Itemid=88&type=downloadskip&extension=%d" % EXTENSION_ID,
                      ]
# Command to download locales with missing strings replaced with english
WGET_DOWNLOAD_REPLACE = ["wget",
                         "--quiet",
                         "--append-output=%s" % LOG_FILE,
                         "--output-document=locales_replace.tar.gz",
                         "--load-cookies", "cookies.txt",
                         "--content-disposition",
                         "http://www.babelzilla.org/index.php?option=com_wts"+
                         "&Itemid=88&type=downloadtar&extension=%d" % EXTENSION_ID,
                         ]
SKIP_DIR = "skip"
REPLACE_DIR = "replace"
LOCALE_DIR = "locale"

# This is used to distinguish between untranslated strings and
# strings that are deliberately blank.
VALID_BLANK_STRINGS = {"ja-JP": 
                        {"dlgnewedit.dtd": 
                          {"ignoreChanges.label": "Ignore changes less than about"}}}

def run():
    (options, args) = parse_args()
    temp_path = tempfile.mkdtemp()
    skip_path = os.path.join(temp_path, SKIP_DIR)
    replace_path = os.path.join(temp_path, REPLACE_DIR)
    try:
        download_locales(temp_path)
        fix_blank_strings(replace_path)
        locales = parse_locales(skip_path)
        (complete, incomplete) = check_complete(locales, verbose=options.verbose)
        if get_yn("Update complete locales?"):
            update_locales(replace_path, complete)
        if options.skip:
            if get_yn("Update incomplete locales, skipping missing strings?"):
                update_locales(skip_path, incomplete)
        else:
            if get_yn("Update incomplete locales, using english if necessary?"):
                update_locales(replace_path, incomplete)
        check_config(complete, incomplete)

    finally:
        shutil.rmtree(temp_path)

def parse_args():
    parser = optparse.OptionParser()
    parser.add_option("-v", "--verbose", 
                      action="store_true", 
                      dest="verbose")
    parser.add_option("-s", "--skip_incomplete", 
                      action="store_true", 
                      dest="skip",
                      help=("Use this option to skip untranslated strings." +
                            "(handy when uploading updated extension to babelzilla)"))
    return parser.parse_args()

def download_locales(temp_path):
    print "Temp path: %s" % temp_path
    log_file = os.path.join(temp_path, LOG_FILE)
    os.mkdir(os.path.join(temp_path, SKIP_DIR))
    os.mkdir(os.path.join(temp_path, REPLACE_DIR))
    try:
        print "Logging in..."
        subprocess.check_call(WGET_LOGIN, cwd=temp_path)
        os.remove(log_file)
        print "Downloading locales (missing skipped)..."
        subprocess.check_call(WGET_DOWNLOAD_SKIP, cwd=temp_path)
        os.remove(log_file)
        print "Downloading locales (missing replaced)..."        
        subprocess.check_call(WGET_DOWNLOAD_REPLACE, cwd=temp_path)
        os.remove(log_file)

    except:
        if os.path.exists(log_file):
            f = open(log_file)
            print f.read()
            f.close()
        raise

    print "Unpacking locales (missing skipped)..."
    subprocess.check_call(["tar", "--directory=%s" % SKIP_DIR, 
                           "-xf", "locales_skip.tar.gz"],
                          cwd=temp_path)
    print "Unpacking locales (missing replaced)..."
    subprocess.check_call(["tar", "--directory=%s" % REPLACE_DIR, 
                           "-xf", "locales_replace.tar.gz"],
                          cwd=temp_path)


def fix_blank_strings(temp_path):
    """ Fix up strings that have deliberately been left blank by the translator
    Babelzilla incorrectly substitutes the English translation, so this needs removing
    """
    for locale in VALID_BLANK_STRINGS.keys():
        for filename in VALID_BLANK_STRINGS[locale].keys():
            for string in VALID_BLANK_STRINGS[locale][filename].values():
                print temp_path, locale, filename
                print ['sed', '-i', 's/%s//' % string, 
                       '%s' % os.path.join(temp_path, locale, filename)]
                subprocess.check_call(['sed', '-i', 's/Ignore changes less than about//', 
                                       '%s' % os.path.join(temp_path, locale, filename)])

def parse_locales(temp_path):
    print "Parsing locales..."
    locales = {}
    locale_dirs = [dir for dir in os.listdir(temp_path)
                   if os.path.isdir(os.path.join(temp_path, dir))]
    for dir in locale_dirs:
        locale = Locale(dir)
        for file in os.listdir(os.path.join(temp_path, dir)):
            ext = os.path.splitext(file)[1]
            if ext == ".properties":
                locale_file = parse_properties_file(os.path.join(temp_path, dir, file))
            elif ext == ".dtd":
                locale_file = parse_dtd_file(os.path.join(temp_path, dir, file))
            elif ext == ".rdf":
                locale_file = parse_rdf_file(os.path.join(temp_path, dir, file))
            else:
                raise Exception, ("Unrecognised locale file extension: %s" % 
                                  os.path.join(temp_path, dir, file))

            # Some translations may have strings that are intentionally blank.
            # These will be missing from the parsed file, so need manually adding.
            if (locale.name in VALID_BLANK_STRINGS.keys() and
                  file in VALID_BLANK_STRINGS[locale.name].keys()):
                for string in VALID_BLANK_STRINGS[locale.name][file].keys():
                    if string in locale_file.keys():
                        raise Exception("String %s in file %s of locale %s is expected to be blank." %
                                        (string, file, locale.name))
                    else:
                        locale_file[string] = ""

            locale.files[file] = locale_file
        locales[dir] = locale
    return locales
                
def parse_properties_file(file):
    result = UnicodeDict()
    for line in open(file):
        line = line.split("#")[0].strip()
        if len(line) > 0:
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()
            if value != "":
                result[key.strip()] = unicode(value.strip(), "utf-8")
    return result

def parse_dtd_file(file):
    result = UnicodeDict()
    for line in open(file):
        split_line = line.split(" ", 2)
        if split_line[0].strip().upper() == "<!ENTITY":
            key = split_line[1].strip()
            quoted_value = split_line[2].split('>')[0].strip()
            if quoted_value[0] != '"' or quoted_value[-1] != '"':
                raise Exception("%s: Entity value not quoted:\n   %s" % (file, line))
            value = quoted_value[1:-1]

            result[key] = unicode(value, "utf-8")
    return result
    
def parse_rdf_file(file):
    return {"__rdf__": open(file).read()}

############################

def check_complete(locales, verbose=False):
    print "Checking for missing strings..."
    locale_en = locales['en-US']
    complete_locales = []
    incomplete_locales = []

    for locale in locales.values():
        locale.complete = is_locale_complete(locale, locale_en, verbose)
        if locale.complete:
            complete_locales.append(locale.name)
        else:
            incomplete_locales.append(locale.name)

    print "\nComplete Locales:"
    for name in sorted(complete_locales):
        print name
    print "\nIncomplete Locales:"
    for name in sorted(incomplete_locales):
        print name

    return (complete_locales, incomplete_locales)

def is_locale_complete(locale, locale_en, verbose):
    ret = True
    for filename in locale_en.files.keys():
        if filename not in locale.files.keys():
            print "File %s not found in locale %s" % (filename, locale.name)
            ret = False
            continue
        
        for string in locale_en.files[filename].keys():
            if string not in locale.files[filename].keys():
                if verbose:
                    print "String %s not found in file %s of locale %s" % \
                        (string, filename, locale.name)
                    ret = False
                    continue
                else:
                    return False
    return ret


############################

def update_locales(temp_path, locales):
    print "Updating Locales..."
    for locale in locales:
        source = os.path.join(temp_path, locale)
        dest = os.path.join(LOCALE_DIR, locale)
        if os.path.exists(dest):
            shutil.rmtree(dest)
        shutil.copytree(source, dest)
        

def check_config(complete, incomplete):
    print
    for name in sorted(complete):
        if name not in config.locales.keys():
            print "WARNING: %s is missing from config.locales[]" % name
    for name in sorted(incomplete):
        if name not in config.incomplete_locales.keys():
            print "WARNING: %s is missing from config.incomplete_locales[]" % name

    for name in sorted(config.locales.keys()):    
        if name not in complete:
            print "WARNING: %s should not be in config.locales[]" % name

    for name in sorted(config.incomplete_locales.keys()):    
        if name not in incomplete:
            print "WARNING: %s should not be in config.incomplete_locales[]" % name

############################

class Locale():
    def __init__(self, name=None):
        self.files = {}
        self.name = name

    def __repr__(self):
        return self.files.__repr__()

class UnicodeDict(dict):
    """ Just like a dict, but encodes __repr__ values in UTF-8 """
    def __repr__(self):
        ret = "{"
        for key, value in self.items():
            ret += "'%s': '%s', " % (key, value.encode("utf-8"))
        ret = ret.rsplit(",", 1)[0]
        ret += "}"
        return ret

def get_yn(message):
    while True:
        result = raw_input(message + " [Y]/n")
        if result == "" or result.upper() == "Y":
            return True
        if result.upper() == "N":
            return False

if __name__ == "__main__":
    run()
