main()

async function main(){
  setDebugLogicListener()
  mainListener();
}

function setDebugLogicListener(){
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'setDebug') {
      setDebug(message.value);
    }
  });
}

async function setDebug(flag){
  if(flag){
    chrome.scripting.executeScript({
      func: () => _satellite.setDebug(1),
      args: [],
      target: {
        tabId: (await chrome.tabs.query({active: true, currentWindow: true}))[0].id
      },
      world: 'MAIN'
    });
  } else{
    chrome.scripting.executeScript({
      func: () => _satellite.setDebug(0),
      args: [],
      target: {
        tabId: (await chrome.tabs.query({active: true, currentWindow: true}))[0].id
      },
      world: 'MAIN'
    });
  }
}

async function mainListener(){
  const filter = {urls: ["<all_urls>"]}//   *://*/*/b/ss/*   --   <all_urls>
  chrome.webRequest.onHeadersReceived.addListener(async info => {
    if(info.statusCode === 200 && /\/b\/ss\//.test(info.url)){
      sendToTab({
        info: info, 
        eventTriggered:"onHeadersReceived", 
        _satelliteInfo:JSON.parse(await getSatelliteInfo())
      });
    }
  }, filter);
}

async function getSatelliteInfo() {
  const [{result}] = await chrome.scripting.executeScript({
    func: () =>  JSON.stringify({
      property: _satellite.property.name, 
      environment: _satellite.environment.stage,
      buildtime: _satellite.buildInfo.buildDate
    }),
    args: [],
    target: {
      tabId: (await chrome.tabs.query({active: true, currentWindow: true}))[0].id
    },
    world: 'MAIN',
  });
  return result;
}

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

