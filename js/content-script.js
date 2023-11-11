 console.log("@@@ Debugging content-script.js");

/*
const script = this.document.createElement('script');
script.src = chrome.runtime.getURL("js/page-script.js");
this.document.documentElement.appendChild(script);
// clean it up afterwards
this.document.documentElement.removeChild(script);
*/

chrome.runtime.onMessage.addListener(msg => console.log("@@@ Debugging CS listener 2:", msg));

chrome.storage.sync.get('aabox', async function (data) {
  if (data && data.aabox !== false) {
    injectJS("_satellite.setDebug(1)");
  } else {
    injectJS("_satellite.setDebug(0)");
  }
}); 

function injectJS(js){
  const script = this.document.createElement('script');
  script.type = 'text/javascript';
  try {
    script.appendChild(document.createTextNode(js));
    this.document.body.appendChild(script);
  } catch (e) {
    script.text = js;
    this.document.body.appendChild(script);
  }
  this.document.documentElement.removeChild(script);
}