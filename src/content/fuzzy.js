
// Returns true if the content is the same (or within a certain number of characters)
function compareFuzzy(content1, content2, threshold)
{
    var index;
    var i;
    
    String.prototype.diffIndex = str_diffIndex; // register new string method

//    dump(content1+":"+content2+"\n");

    shortest = Math.min(content1.length, content2.length);
    if (shortest+threshold < Math.max(content1.length, content2.length)) {
       return false; // Lengths are too different - can't be a match
    }

    // At each difference, cut out (threshold) characters,
    // then see if the remaining text matches up.

    while (content1 != content2) {
        index = content1.diffIndex(content2);
    //    dump("\n"+index+"Index\n");
        
        shortest = Math.min(content1.length, content2.length);
        if (index+threshold*2 >= shortest) {
            return true; // Got to the end of one string
        }
    
        // Slice the start off each string
        content1 = content1.slice(index+threshold);
        content2 = content2.slice(index+threshold);
    
        // See if there's a match within the threshold
        for (i=0; ; i++) {
    //        dump(content1+"-"+content2.slice(i)+"\n");
    //        dump("s1"+content1.diffIndex(content2.slice(i))+"\n");
    //        dump(content1.slice(i)+"-"+content2+"\n");
    //        dump("s2"+content2.diffIndex(content1.slice(i))+"\n");
    
            // Does the match last for 10 characters?
            if (content1.diffIndex(content2.slice(i)) > 10) {
        //        dump("match1 at "+i+"\n");
                content2 = content2.slice(i);
                break;
            }
            if (content2.diffIndex(content1.slice(i)) > 10) {
        //        dump("match2 at "+i+"\n");
                content1 = content1.slice(i);
                break;
            }
            
            if (i==threshold) {
              return false; // No match within the threshold
            }
        }
    }

    return true;
}

// new method for String the returns the first index where the two strings
// don't match
function str_diffIndex(string2)
{
    var i, minlen;

    minlen = Math.min(this.length, string2.length);
    
    for (i=0; i<minlen; i++) {
       if (this[i] != string2[i]) {
           return i;
       }
    }

    return minlen;
}
