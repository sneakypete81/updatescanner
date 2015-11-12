/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UpdateScanner.Fuzzy = {

// Returns true if the content is the same (or within a certain number of characters)
compare : function(content1, content2, threshold)
{
    var me = UpdateScanner.Fuzzy;
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
},
};