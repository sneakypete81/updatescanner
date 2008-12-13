#!/bin/bash

# Usage: $ ./unused-entities.sh path/to/locale-directory/ path/to/content-directory/
echo "Unused entities:"

for dtdfile in `ls $1*.dtd`
do
	awk '/<!ENTITY/ {print $2}' < $dtdfile | while read line
	do
		search=`grep -R "${line}" "$2"`
		if [ "$search" == "" ]
		then
			echo "${line}";
		fi
	done;
done;

echo ""
echo "Unused properties:"

for propfile in `ls $1*.properties`
do
	awk -F "=" '{if (!($2 == "")) { print $1 }}' < $propfile | while read line
	do
		search=`grep -R "${line}" "$2"`
		if [ "$search" == "" ]
		then
			echo "${line}";
		fi
	done;
done;
