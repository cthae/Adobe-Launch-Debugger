# Adobe Launch Debugger
Debugger tool for Adobe Launch and Adobe Analytics.

### Table of Contents
* [Purpose](https://github.com/hillaryfraley/jobbriefings#purpose)
* [Scope](https://github.com/hillaryfraley/jobbriefings#scope)
* [Plan](https://github.com/hillaryfraley/jobbriefings#plan)
* [Contributions](https://github.com/hillaryfraley/jobbriefings#contributions)
* [License](https://github.com/hillaryfraley/jobbriefings#license)

## Purpose
The purpose can be divided in a few segments, sorted by importance desc:
* Make it faster for Adobe Analytics implementation engineers and analysts to debug the front-end part of Adobe Analytics and Adobe Launch.
* Make it more comfortable to consume the debugging data.
* Make it possible for a larger analytics community to contribute to open source debugging tools not associated with any commercial corp.
* Make it easier for associated third parties like front-end developers and QAs to use the analytics debugging data.

## Scope
This extension essentially has three parts accomplishing different facets of AA/Launch debugging:
* **Essential info Popup**. Make it easier and faster to get essential information about the Launch library and primitive highlighting of essential concerns:
  
  ![alt no Launch Present Screenshot](https://i.imgur.com/pgTJsfR.jpg) ![alt Launch Present Screenshot](https://i.imgur.com/u1Ejxk3.jpg)
  
* **Console logging**. Completely reimplement and improve what the AA Debugger extension does, fixing its bugs and ui, adding more configuration options:
  
  ![alt console logging suspended](https://i.imgur.com/DVaNQFA.jpg) ![alt console logging expanded](https://i.imgur.com/3bgZQf7.jpg)
  
* **Library Replacement**. Reimplement the Switch extension, essentially, but simpler and working. Simple logic to redirect the launch library fetch to a custom library. This is Planned only.

## Plan
The dev plan:
* Add logic to parse POST b/ss requests too
* Finish the Hierarchies parsing and logging
* Finish the Product string parsing and reporting
* Adjust colors in the console logging to work well in the light console
* Add settings to change the default behavior of the main console log to be collapsed
* Add a settings and info tabs to the popup
* Get some help from designers on the favicon, popup ui and logging
* Release to the Chrome web store - first release
* Implement the library switching logic

## Contributions
Contributions are welcome! Whether it's code, ux/ui solutions or just advice. If you're inspired to do so, please contribute!

## License
Mozilla Public License Version 2.0
