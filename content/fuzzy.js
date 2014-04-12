/* ***** BEGIN LICENSE BLOCK *****
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific language governing rights and limitations
 * under the License.
 * 
 * The Original Code is Update Scanner.
 * 
 * The Initial Developer of the Original Code is Pete Burgers.
 * Portions created by Pete Burgers are Copyright (C) 2006-2007
 * All Rights Reserved.
 * 
 * Contributor(s):
 * 
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.  
 * ***** END LICENSE BLOCK ***** */

if (typeof(USc_fuzzy_exists) != 'boolean') {
var USc_fuzzy_exists = true;
var USc_fuzzy = {    

// Returns true if the content is the same (or within a certain number of characters)
compare : function(content1, content2, threshold)
{
    var me = USc_fuzzy;
    var index;
    var i;
    
    var shortest = Math.min(content1.length, content2.length);
    if (shortest+threshold < Math.max(content1.length, content2.length)) {
       return false; // Lengths are too different - can't be a match
    }

    // At each difference, cut out (threshold) characters,
    // then see if the remaining text matches up.

    while (content1 != content2) {
        index = me._diffIndex(content1, content2);
        
        shortest = Math.min(content1.length, content2.length);
        if (index+threshold*2 >= shortest) {
            return true; // Got to the end of one string
        }
    
        // Slice the start off each string
        content1 = content1.slice(index+threshold);
        content2 = content2.slice(index+threshold);
    
        // See if there's a match within the threshold
        for (i=0; ; i++) {
            // Does the match last for 10 characters?
            if (me._diffIndex(content1, content2.slice(i)) > 10) {
                content2 = content2.slice(i);
                break;
            }
            if (me._diffIndex(content2, content1.slice(i)) > 10) {
                content1 = content1.slice(i);
                break;
            }
            
            if (i==threshold) {
              return false; // No match within the threshold
            }
        }
    }

    return true;
},

// Returns the first index where the two strings don't match
_diffIndex : function(string1, string2)
{
    var i, minlen;

    minlen = Math.min(string1.length, string2.length);
    
    for (i=0; i<minlen; i++) {
       if (string1[i] != string2[i]) {
           return i;
       }
    }

    return minlen;
}
}
}