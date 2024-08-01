# Universal Adobe Debugger
Debugger tool for Adobe Launch, AEP and Adobe Analytics.

### Table of Contents
* [Purpose](https://github.com/cthae/Adobe-Launch-Debugger/blob/main/README.md#purpose)
* [Scope](https://github.com/cthae/Adobe-Launch-Debugger/blob/main/README.md#scope)
* [Plan](https://github.com/cthae/Adobe-Launch-Debugger/blob/main/README.md#plan)
* [Contributions](https://github.com/cthae/Adobe-Launch-Debugger/blob/main/README.md#contributions)
* [Special Thanks](https://github.com/cthae/Adobe-Launch-Debugger/blob/main/README.md#special-thanks)
* [License](https://github.com/cthae/Adobe-Launch-Debugger/blob/main/README.md#license)

## Purpose
The purpose can be divided in a few segments, sorted by importance desc:
* Make it faster for Adobe Analytics implementation engineers and analysts to debug the front-end part of Adobe Analytics, AEP or Adobe Launch. Ideally, as fast as possible while still keeping it universal.
* Make it more comfortable to consume the debugging data.
* Make it possible for a larger analytics community to contribute to open source debugging tools not associated with any corp.
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
* [x] Add a feature to highlight merch events that aren't present in s.events. Why would Adobe do this? Feels like a bug.
* [x] Merchandising variables logging improvements (", " delimiter instead of the pipe "|").
* [x] Add reporting for s.zip, currency code, org id (mcorgid) and visitor id (mid).
* [x] The "Other" reporting section is now collapsed by default due to the number of not-so-useful new dimensions added there.
* [x] A bit more ui improvements.
* [x] Release v1.01.
* [x] Allow the user to set their own variables to be included in the header of the logging. Thanks Arun T for suggesting.
* [x] Improve _satellite.setDebug(0) to work immediately rather than after a page reload.
* [x] Small cosmetic improvements.
* [x] Release v1.02.
* [x] CSS improvements of the extension popup. Thanks Chip!
* [x] Fix a bug in the new custom logging code.
* [x] Add a line to indicate the end of the main logging group for easier reading.
* [x] Release v1.03.
* [x] Configure selective logging for the web SDK.
* [x] Release v1.04.
* [x] QOL Improvements for the custom web SDK logging.
* [x] Allow the underscore in the field names.
* [x] Small reporting improvements.
* [x] Release v1.05.
* [x] Replace the counter of PVs and links with AA calls and WebSDK calls
* [x] Web SDK: Improve autodebugging: indicate when linkClicks will be treated as pageviews in AA due to the web fields set.
* [x] Web SDK: Surface the Edge config ids for every request, make them visible just like AA Report Suites. To ease the debugging of multi-destinational tracking. First 5 characters should suffice.
* [x] Web SDK: Improve the tracking of network errors when edge network requests fail.
* [x] Web SDK: Refactor logging. Make it less confusing. No more nested groups. 
* [x] Web SDK: Change the default logging a bit to maybe try and expand the analytics object automatically. 
* [x] Web SDK: Add a setting to remove the essentially useless xdm fields that are rarely useful to look at. On by default.
* [x] Web SDK: Improve the logging for non-object fields.
* [x] Web SDK: Add logging for the data.__adobe object. Off by default in settings.
* [x] Web SDK: Reinforce the custom logging field, allow people to use the xdm. reference in the list of params.
* [x] Release v1.06 (Byanka's Web SDK improvements update)
* [x] Small popup UI improvements.
* [ ] Web SDK: Apply the error logging logic to Web SDK tracking too
* [ ] Add a callback and error logging for "cancelled" requests. That's when the browser cancells the request.
* [ ] Web SDK: Add logging for "event" just like we have for "data"
* [ ] Web SDK: Make an option to exclude Target Web Sdk calls when they don't land in Anaytics. Have them excluded by default.
* [ ] Consider adding support for other consent management systems, mostly TrustArc and Adobe's Evidon.
* [ ] Hesitant: Web SDK: Add a setting to limit the number of characters for the config id logging in the websdk tracking. 4 characters by default.
* [ ] Hesitant: Web SDK: Allow for custom Edge base path. It's /ee/ by default, but it can be customized, in which case the extension won't catch the network requests. (who uses a custom Edge base path?)
* [ ] Hesitant: Find an elegant way to inject a library rather than replace it. Should probably be one/domain. To avoid doing it globally. Maybe not... It's so rare that we would need it, just use Overrides for ad-hoc injections?


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
* To the **#javascript** channel of [Libera Chat](https://libera.chat/) community and especially to [LJHarb](https://github.com/ljharb) in there for always being able to answer even most complex JS questions with kindness and patience.
* To the [Chromium Extensions](https://groups.google.com/a/chromium.org/g/chromium-extensions) Google group and especially to [wOxxOm](https://stackoverflow.com/users/3959875/woxxom) there and on Stack Overflow for guiding me through most critical stages of extension development.

## License
Mozilla Public License Version 2.0
