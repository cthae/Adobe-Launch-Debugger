const filter = {urls: ["<all_urls>"]}
const urls = new Map();

chrome.webRequest.onBeforeRequest.addListener((info) => {
  //if(/b\/ss/.test(info.url))
  sendToTab({info: info, eventTriggered:"onBeforeRequest"});
}, filter);

chrome.webRequest.onHeadersReceived.addListener(info => {
  if(info.statusCode === 200){
    //sendToTab({info: info, eventTriggered:"onHeadersReceived"});
  }
}, filter);
/*
chrome.webRequest.onErrorOccurred.addListener(info => {
  sendToTab({info: info, eventTriggered:"onErrorOccured"});
  urls.delete(info.requestId);
}, filter);
*/
//let interval = setInterval(() => {sendToTab("@@@ Debugging: Testing the messaging")},1000);

async function sendToTab(msg) {
  const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
  const tabId = tab.id;
  for (let retry = 0; retry < 20; retry++) {
    try {
      return await chrome.tabs.sendMessage(tabId, msg, {frameId: 0});
    } catch (err) {
      if (!err.message.includes('Receiving end does not exist')) throw err;
    }
  }
}
