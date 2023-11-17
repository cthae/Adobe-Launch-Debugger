main()

async function main() {
  setDebugLogicListener()
  mainListener();
}

function setDebugLogicListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'setDebug') {
      setDebug(message.value);
    }
  });
}

async function setDebug(flag) {
  if (flag) {
    chrome.scripting.executeScript({
      func: () => window._satellite ? _satellite.setDebug(1) : '',
      args: [],
      target: {
        tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id
      },
      world: 'MAIN'
    });
  } else {
    chrome.scripting.executeScript({
      func: () => window._satellite ? _satellite.setDebug(0) : '',
      args: [],
      target: {
        tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id
      },
      world: 'MAIN'
    });
  }
}

async function mainListener() {
  const filter = { urls: ["<all_urls>"] }//   *://*/*/b/ss/*   --   <all_urls>
  const requests = new Map();
  chrome.webRequest.onBeforeRequest.addListener(async info => {
    if (/\/b\/ss\//.test(info.url) && info.method === "POST" && 
      info.requestBody.raw && info.requestBody.raw.length > 0) {
      let postedString = decodeURIComponent(String.fromCharCode.apply(null,
        new Uint8Array(info.requestBody.raw[0].bytes)));
      requests.set(info.requestId, {
        info: info,
        postPayload: postedString,
        eventTriggered: "onBeforeRequest"
      });
    }
  }, filter, ['requestBody']);

  chrome.webRequest.onHeadersReceived.addListener(async info => {
    if (info.statusCode === 200 && /\/b\/ss\//.test(info.url)) {
      let _satelliteInfo = JSON.parse(await getSatelliteInfo())
      const postRequest = requests.get(info.requestId);
      if (info.method === "POST" && postRequest){
        postRequest._satelliteInfo = _satelliteInfo;
        sendToTab(postRequest);
        requests.delete(info.requestId);
      } else {
        sendToTab({
          info: info,
          eventTriggered: "onHeadersReceived",
          _satelliteInfo: _satelliteInfo
        });
      }
    }
  }, filter);
}

async function getSatelliteInfo() {
  const [{ result }] = await chrome.scripting.executeScript({
    func: () => JSON.stringify({
      property: _satellite.property.name,
      environment: _satellite.environment.stage,
      buildtime: _satellite.buildInfo.buildDate
    }),
    args: [],
    target: {
      tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id
    },
    world: 'MAIN',
  });
  return result;
}

async function sendToTab(msg) {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tabId = tab.id;
  for (let retry = 0; retry < 20; retry++) {
    try {
      return await chrome.tabs.sendMessage(tabId, msg, { frameId: 0 });
    } catch (err) {
      if (!err.message.includes('Receiving end does not exist')) throw err;
    }
  }
}

