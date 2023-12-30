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
  
  ![alt no Launch Present Screenshot](https://i.imgur.com/sN7RlGA.jpg) ![alt Launch Present Screenshot](https://i.imgur.com/DcaKQ4I.jpg)
  
* **Console logging**. Completely reimplement and improve what the AA Debugger extension does, fixing its bugs and ui, adding more configuration options:
  
  ![alt console logging suspended](https://i.imgur.com/orqRiQS.jpg) ![alt console logging expanded](https://i.imgur.com/QatXYvT.jpg)
  
* **Library Replacement**. Reimplement the Switch extension, essentially, but simpler and working. Simple logic to redirect the launch library fetch to a custom library. This is Planned only.

## Plan
The dev plan and event log:
* [x] Add logic to parse POST b/ss requests too
* [x] Finish the Hierarchies parsing and logging
* [x] Finish the Product string parsing and reporting
* [x] Adjust colors in the console logging to work well in the light console
* [x] Add a settings and info tabs to the popup
* [x] Add settings to change the default behavior of the main console log to be collapsed
* [x] Deploy a test launch property with AA tracking for advanced testing
* [x] Get some help from designers on the favicon, popup ui and logging
* [x] Initial release to the Chrome web store v0.87 - first release: https://chromewebstore.google.com/detail/adobe-launch-debugger/ehadnibhemgjphdjgkallndphbghlpkn
* [x] Wrong DL is checked sometimes for the last event info (GTM's DL instead of DM)
* [x] Add logging for the Site Section near the PV info
* [x] Implement server call counting in logging
* [x] Release the v0.88
* [x] When DL found, clicking on the DL cell will neatly print it to the console.
* [x] When last event in DL found, clicking on the its cell will neatly print it to the console.
* [x] Empty product fields are reported as Undefined when they're not defined. Replace it with a less generic message or just an empty string to avoid confusion for when "undefined" is the actual value of it
* [x] A pageview is misfiring on adobe launch site. When there's no page/link name in a call, make it clear. 
* [X] Implement logging for failed server calls. Maybe an SSL error is a good one to simulate.
* [x] Release the v0.90
* [x] Formatting improvements in Settings.
* [x] Simplest Launch library detection logic (from DOM only, whatever has \/launch-.*8\.js) (MVP)
* [x] Redirections settings/error reporting logic.
* [x] Redirections management tab and logic.
* [x] SetDebug's default state is not taken into account.
* [x] Less bold text in ui.
* [x] Add an option to quickly kill current page's redirection from the Settings tab.
* [x] Implement the actual library switching logic (redirects)
* [x] Add a button to delete all redirects.
* [x] Make sure redirects logic is synced and enabled automatically when user uses a different browser with the same account and extension sync is on.
* [x] Add an option for redirects to be session-based. By default.
* [x] Instead of reporting into an active tab, report into the one the listeners are deployed to.
* [ ] Deal properly with empty dataLayers found. (the extension throws)
* [ ] Deploy a polling logic for _satellite for when doing the setDebug()
* [ ] Web SDK/AEP logging implementation.
* [ ] Release.
* [ ] Once the library switching logic is done, implement a setting to remove the .min from the library. It's gonna utilize the same redirecting logic. Off by default.
* [ ] Check Adobe Analytics Debugger's changelog. Some things from there might be worth reimplementing.

## Contributions
Contributions are welcome! Whether it's code, ux/ui solutions or just advice. If you're inspired to do so, please contribute!

## License
Mozilla Public License Version 2.0
