#!/usr/bin/python
import os

dtdName="diffPage.dtd"
propertyName="diffPage.properties"
items=["view", "oldPage", "newPage", "changes", "currentPage"]

for locale in os.listdir("."):
    dtdfile=os.path.join(locale, dtdName)
    propertyfile=os.path.join(locale, propertyName)
    if os.path.isfile(dtdfile):
        properties=[]
        dtds=[]
        f = open(dtdfile)
        print locale+":"
        for line in f:
            found = False
            for item in items:
                if line.startswith("<!ENTITY "+item):
                    properties.append(item+"="+line[line.find("\"")+1:line.rfind("\"")]+"\n")
                    found = True
            if not found:
                dtds.append(line);
        f.close()
        f = open(dtdfile, "w")
        f.writelines(dtds)
        f.close()
        f = open(propertyfile, "w")
        f.writelines(properties)
        f.close()
