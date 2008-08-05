#!/usr/bin/python
"""
Usage: build_img.py sourcepath destpath
Each file in sourcepath is resized and written to destpath 
"""
import sys
import os
import shutil

imagePreviews=['browser_context_menu.png',
               'properties_dialog.png',
               'webpage_changes.png'
               ]
maxSizes={'browser_context_menu.png'      :'800x600>',
          'browser_context_menu_prv.png'  :'400x600>',
          'button_delete.png'             :'120x40>',
          'button_new.png'                :'120x40>',
          'button_newtabs.png'            :'120x40>',
          'button_scan.png'               :'120x40>',
          'notification_popup.png'        :'200x200>',
          'properties_dialog.png'         :'800x600>',
          'properties_dialog_prv.png'     :'400x600>',
          'sidebar_context.png'           :'800x600>',
          'statusbar.png'                 :'400x600>',
          'webpage_changes.png'           :'800x600>',
          'webpage_changes_prv.png'       :'400x600>',
          'pref_notifications.png'        :'800x600>',
          'pref_scanning.png'             :'800x600>',
          'pref_toolbar.png'              :'800x600>'
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
