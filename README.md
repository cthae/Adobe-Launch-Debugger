# Adobe Launch Debugger
Debugger tool for Adobe Launch and Adobe Analytics.

### Table of Contents
* [Purpose](https://github.com/cthae/Adobe-Launch-Debugger/blob/main/README.md#purpose)
* [Scope](https://github.com/cthae/Adobe-Launch-Debugger/blob/main/README.md#scope)
* [Plan](https://github.com/cthae/Adobe-Launch-Debugger/blob/main/README.md#plan)
* [Contributions](https://github.com/cthae/Adobe-Launch-Debugger/blob/main/README.md#contributions)
* [Special Thanks](https://github.com/cthae/Adobe-Launch-Debugger/blob/main/README.md#special-thanks)
* [License](https://github.com/cthae/Adobe-Launch-Debugger/blob/main/README.md#license)

## Purpose
The purpose can be divided in a few segments, sorted by importance desc:
* Make it faster for Adobe Analytics implementation engineers and analysts to debug the front-end part of Adobe Analytics and Adobe Launch.
* Make it more comfortable to consume the debugging data.
* Make it possible for a larger analytics community to contribute to open source debugging tools not associated with any commercial corp.
* Make it easier for associated third parties like front-end developers and QAs to see the live analytics data.

## Scope
This extension essentially has four parts accomplishing different facets of AA/Launch debugging:
* **Essential info Popup**. Make it easier and faster to get essential information about the Launch library and primitive highlighting of essential concerns:
  
  ![alt no Launch Present Screenshot](https://i.imgur.com/BoKaWwG.jpg) ![alt Launch Present Screenshot](https://i.imgur.com/ICeZjLw.jpg)
  
* **Console logging**. Completely reimplement and improve what the AA Debugger extension does, fixing its bugs and ui, adding more configuration options:

  ![alt console logging](https://github.com/cthae/Adobe-Launch-Debugger/assets/55302327/cfcc48e0-81c0-4346-bb66-1372bd9f0bb6)

* **Library Replacement**. Reimplement the Switch extension, essentially, but simpler and working properly. Simple logic to redirect the launch library fetch to a custom library.

* * **AEP Debugging**. The Web SDK debugging is just an MVP for now, essentially pretty-printing the xdm object sent.

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
* [x] Deal properly with empty dataLayers found. (the extension throws)
* [x] Release v0.95.
* [x] Implement _satellite.setDebug() polling logic for when the lib is not loaded when the extension tries to set it.
* [x] Deletion of all redirection rules must delete both dynamic and sync rules.
* [x] Better date formatting.
* [x] Add useful snippets to the extension. Basically window.onbeforeunload = ()=>false and one trust stuff maybe.
* [x] Release v0.96.
* [x] setDebug reimplementation. Now it works better.
* [x] Release v0.97.
* [x] Also detect /satelliteLib- libraries besides /launch-
* [x] Context data logging: https://experienceleague.adobe.com/docs/analytics/implementation/vars/page-vars/contextdata.html?lang=en Thanks to chip for suggesting it!
* [x] Release v0.98.
* [x] OT - Allow All and Deny All buttons.
* [x] Web SDK/AEP MVP logging implementation.
* [x] setDebug made more reliable.
* [x] Slight UI adjustments.
* [x] Update extension store/repo screenshots.
* [x] Release v0.99.
* [x] Raccooning!
* [x] Release v1.00.
* [x] Code refactory in the popup scripts.
* [ ] Add a feature to highlight merch events that aren't present in s.events. Why would Adobe do this? Feels like a bug.
* [ ] Get feedback from a larger audience.
* [ ] Find an elegant way to inject a library. Should probably be one/domain. To avoid doing it globally.
* [ ] Once the library switching logic is done, implement a setting to remove the .min from the library. It's gonna utilize the same redirecting logic. Off by default.
* [ ] Check Adobe Analytics Debugger's changelog. Some things from there might be worth reimplementing.
* [ ] Update extension store screenshots. Maybe make a big fun logo too.

## Contributions
Contributions are welcome! Whether it's code, ux/ui solutions or just advice. If you're inspired to do so, please contribute!

### To install the extension in the unpacked state:
* Clone the repo
* Open your Chrome -> open chrome://extensions/ -> in the top right of the page, there's a Developer mode slider. Enable it
* In the extensions page, select the Load unpacked option. Load this repo's folder.
* Done, you've installed it

### To test changes:
If it's a UI change in the extension-script.js, css files or main.html, just click the extension icon in the browser to reload its popup window and you'll see your changes

If it's a deeper change of the content-script.js or background.js or manifest, you'll have to reload the extension:
* Open the extensions page chrome://extensions/
* Click the reload CTA in the extension card near the enable/disable slider.

## Special thanks
* To the **#adobe-launch** and **#adobe-analytics** channels of [Measure Slack](https://www.measure.chat/) community for early testing and precious feedback from staff enterprise analytics experts.
* To the **#javascript** channel of [Libera Chat](https://libera.chat/) community and especially to [ljharb](https://github.com/ljharb) in there for always being able to answer even most complex JS questions with kindness and patience.
* To the [Chromium Extensions](https://groups.google.com/a/chromium.org/g/chromium-extensions) Google group and especially to [wOxxOm](https://stackoverflow.com/users/3959875/woxxom) there and on Stack Overflow for guiding me through most critical stages of extension development.

## License
Mozilla Public License Version 2.0
