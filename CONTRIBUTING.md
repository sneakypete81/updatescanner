Contributing
------------

All development takes place at [GitHub](https://github.com/sneakypete81/updatescanner). New features and bugfixes are very welcome - please fork and submit pull requests.

The following instructions are for Linux development. They'll probably work in OSX. If you're using Windows, you'll need [Cygwin](http://cygwin.com).

### Get the source

See https://help.github.com/articles/fork-a-repo

### Dependencies

To build .xpi files, you'll need: 
 * Make
 * Python 2.7

### Build

From your working copy, type the following to build a fresh .xpi:
```
make
```
This should create ```updatescan-<version>.xpi``` in the ```_releases``` directory.
