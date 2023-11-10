console.log("@@@ Debugging content-script.js");

/*
const script = this.document.createElement('script');
script.src = chrome.runtime.getURL("js/page-script.js");
this.document.documentElement.appendChild(script);
// clean it up afterwards
this.document.documentElement.removeChild(script);
*/

chrome.runtime.onMessage.addListener(msg => console.log("@@@ Debugging CS listener 2:", msg));