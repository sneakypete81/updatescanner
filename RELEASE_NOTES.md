Update Scanner Release Notes
============================

3.3.2:
------
* Fixed: Don't lock up if bookmark deleted while scanning (#72)
* Fixed: Disable "Mark changes with << >>" when "Highlight changes" is unchecked (#78)
* Fixed: Marked addon as multiprocessCompatible

3.3.1: (10 September 2016)
------
* Fixed: Included missing translations (#74)

3.3.0: (9 September 2016)
------
* Feature: Optionally add << >> markers around highlighted changes (#51)

3.2.4: (20 February 2016)
------
* Fixed: Don't change alert window size, just slide it up/down (#66)
* Fixed: Alert working again on Win10 (#66)

3.2.3: (16 August 2015)
------
* Locale: Updated Russion translation - thanks Vyacheslav Chudievich (#55)
* Locale: Updated Bulgarian translation - thanks stoyan
* License: Upgraded to MPL 2.2

3.2.2: (NOT RELEASED)
------
(This version introduced 'about:updatescan' URIs for Electolysis support,
 which was abandoned when Electrolysis started accepting 'chrome: URIs)

3.2.1: (23 November 2014)
------
* Feature: Build script improvements for dev builds
* Fixed: Addon Compatibility Check improvements (#25)

3.2.0: (20 September 2014)
------
* Fixed: Improved page view performance (#18)

3.1.17: (8 September 2014)
-------
* Fixed: FF32 no longer supports rdf:charset-menu, replace with a textbox (#20)

3.1.16: (3 September 2014)
-------
* Fixed: Removed Mac-specific disabling of permanent notification option (#12, #14)

3.1.15: (6 July 2014)
-------
* Fixed: Updated help links to website on Github (#3)

3.1.14: (4 June 2014)
-------
* Fixed: FF29 notification popup has no close button (#5)

3.1.13: (9 April 2014)
-------
* Fixed: FF29 issue with installation and autoscanning.

3.1.12: (23 March 2013)
-------
* Fixed: F22 support
* Fixed: Updated website URL

3.1.10: (29 July 2012)
-------
* Fixed: Updates for improved FF13 compatibility
* Fixed: FF15 sidebar highlighting

3.1.8: (30 July 2011)
------
* Fixed: FF6 support
* Fixed: Single page scan now working again.

3.1.7: (28 June 2011)
------
* Fixed: Improved namespacing
* Fixed: Annotation query error when item doesn't exist

3.1.6: (22 June 2011)
------
* Fixed: FF5 support
* Fixed: Addon validation improvements

3.1.5: (23 April 2011)
------
* Locale: Japanese translation - thanks mfuji!

3.1.4: (6 February 2011)
------
* Feature: Toolbar icon can now be moved (View->Toolbars->Customise, then drag to new location)
* Fixed: Updated icon sizes for Firefox 4
* Fixed: Help page location - Mozdev redirect no longer works
* Fixed: Moved from JAR to flat addon structure
* Fixed: Addon validation warnings
* Locale: Swedish & Bulgarian translation (thanks Lakrits & Stoyan!)

3.1.3: (19 August 2010)
------
* Fixed: FF4 support
* Fixed: Sidebar style update issue
* Locale: Updated French, Turkish, Simplified Chinese, Bulgarian locales

3.1.2: (28 January 2010)
------
* Feature: Ctrl+Click, Alt+Click, Shift+Click in sidebar shows changes in new tab
* Feature: New config option: Left-click in sidebar can be set to show changes in new tabs
* Feature: Delete link added to page header
* Fixed: FF3.6 support
* Fixed: Conflict with bookmarks sidebar context menu (bug 21934)
* Fixed: _extendPlacesTreeView bug. Thanks Bex
* Fixed: nsINavBookmarkObserver::onBeforeItemRemoved bug. Thanks again Bex
* Fixed: Ensure tree refreshes properly
* Fixed: Improved compatibility (removed string prototypes)

3.0.8: (15 December 2009)
------
* Feature: CPU load reduction when viewing multiple tabs
* Feature: Enable/Disable scanning (right-click on the statusbar icon)
* Feature: Enable/Disable javascript/plugins
* Feature: Configurable highlight colour
* Feature: Double-click statusbar icon shows all changes

3.0.5: (5 July 2009)
------
* Fixed: FF3.5 support
* Fixed: Problem with (No Title) bookmark folder

3.0.4: (14 June 2009)
------
* Feature: All javascript and plugins displayed
* Fixed: Pages rendered more correctly
* Fixed: Performance improvements
* Fixed: Security tightened (thanks to Matthew Wilson & Roberto Suggi)
