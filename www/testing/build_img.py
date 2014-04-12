#!/usr/bin/python
"""
Usage: build_img.py sourcepath destpath
Each file in sourcepath is resized and written to destpath 
"""
import sys
import os
import shutil

imagePreviews=['browser_context_menu.png',
               'properties_dialog_advanced.png',
               'webpage_changes.png'
               ]

img_button = '120x40>'
img_preview = '400x600>'
img_large = '900x900>'

maxSizes={'browser_context_menu.png'      : img_large,
          'browser_context_menu_prv.png'  : img_preview,
          'button_delete.png'             : img_button,
          'button_new.png'                : img_button,
          'button_newtabs.png'            : img_button,
          'button_scan.png'               : img_button,
          'notification_popup.png'        : img_preview,
          'properties_dialog.png'         : img_preview,
          'properties_dialog_advanced.png': img_large,
          'properties_dialog_advanced_prv.png': img_preview,
          'sidebar_context.png'           : img_large,
          'statusbar.png'                 : img_preview,
          'statusbar_menu.png'            : img_preview,
          'webpage_changes.png'           : img_large,
          'webpage_changes_prv.png'       : img_preview,
          'pref_notifications.png'        : img_large,
          'pref_scanning.png'             : img_large,
          'pref_toolbar.png'              : img_large,
          'donate.png'                    : img_preview,
            }

try: 
    srcpath = sys.argv[1]
    destpath = sys.argv[2]
except: 
    print __doc__ 
    sys.exit(1)

print "Creating Previews..."
for file in maxSizes.keys():
    if os.path.splitext(file)[0][-4:] == "_prv" and not os.path.isfile(os.path.join(srcpath, file)):
        srcfile=os.path.splitext(file)[0][:-4]+os.path.splitext(file)[1]
        print srcfile+" --> "+file
        shutil.copy(os.path.join(srcpath, srcfile), os.path.join(srcpath, file))

print "\nResizing..."
for file in os.listdir(srcpath):
    if os.path.isfile(os.path.join(srcpath, file)):
        print file
        command = ('convert ' + os.path.join(srcpath, file) + 
                  ' -resize "' + maxSizes[file] + '" ' 
                  + os.path.join(destpath, file))
#        print command
        os.system(command)
