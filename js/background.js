main()

chrome.runtime.onStartup.addListener(checkSettings);

chrome.runtime.onInstalled.addListener(checkSettings);

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
  chrome.scripting.executeScript({
    func: (flag) => {
      localStorage.setItem("com.adobe.reactor.debug", !!flag);
      typeof _satellite !== 'undefined' ? _satellite?.setDebug(flag ? 1 : 0) : '';
    },
    args: [flag],
    target: {
      tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id
    },
    world: 'MAIN'
  });
}

async function mainListener() {
  const filter = { urls: ["<all_urls>", "http://*/*", "https://*/*"] }//   *://*/*/b/ss/*   --   <all_urls>
  const requests = new Map();
  chrome.webRequest.onBeforeRequest.addListener(async info => {
    let urlType = getUrlType(info.url);
    if (urlType !== "Not Adobe") {
    }
    if (urlType !== "Not Adobe" && info.method === "POST" &&
      (info?.requestBody?.raw?.length > 0 || info?.requestBody?.formData || urlType === "Beaconed webSDK")) {
      let postedString = "";
      if (urlType === "AA") {
        postedString = universalPostParser(info);
      } else if (urlType === "webSDK") {
        postedString = universalPostParser(info);
      } else if (urlType === "Beaconed webSDK") {
        sendToTab({
          info: info,
          eventTriggered: "onBeforeRequest",
          type: urlType
        }, info.tabId);
        return; //pings (beacons) sometimes don't get responses, or they come in too late, so this.
      }
      requests.set(info.requestId, {
        info: info,
        postPayload: postedString,
        eventTriggered: "onBeforeRequest",
        type: urlType
      });
      setTimeout(processOrphanedRequest, 6000, info.requestId);
    }
  }, filter, ['requestBody']);

  chrome.webRequest.onHeadersReceived.addListener(async info => {
    let urlType = getUrlType(info.url);
    if (urlType !== "Not Adobe" && info.statusCode === 200) {
      let _satelliteInfo = JSON.parse(await getSatelliteInfo(info.tabId))
      const postRequest = requests.get(info.requestId);
      if (info.method === "POST" && postRequest) {
        postRequest._satelliteInfo = _satelliteInfo;
        sendToTab(postRequest, info.tabId);
      } else {
        sendToTab({
          info: info,
          eventTriggered: "onHeadersReceived",
          _satelliteInfo: _satelliteInfo,
          type: urlType
        }, info.tabId);
      }
      requests.delete(info?.requestId);
    }
  }, filter);

  chrome.webRequest.onErrorOccurred.addListener(async info => {
    let urlType = getUrlType(info.url);
    if (urlType !== "Not Adobe") {
      let _satelliteInfo = JSON.parse(await getSatelliteInfo(info.tabId))
      sendToTab({
        info: info,
        eventTriggered: "onErrorOccurred",
        _satelliteInfo: _satelliteInfo,
        type: urlType
      }, info.tabId);
    }
    //requests.delete(info?.requestId);
  }, filter);

  async function processOrphanedRequest(requestId) {
    const request = requests.get(requestId);
    if (request) {
      request._satelliteInfo = JSON.parse(await getSatelliteInfo(request.info.tabId));
      request.eventTriggered = "timeoutError";
      sendToTab(request, request.info.tabId);
    }
  }
}

function getUrlType(url) {
  if (/\/b\/ss\//.test(url)) {
    return "AA";
  } else if (/\/ee\/.*interact\?configId=/.test(url)) {
    return "webSDK";
  } else if (/\/ee\/.*collect\?configId=/.test(url)) {
    return "Beaconed webSDK";
  } else {
    return "Not Adobe";
  }
}

async function getSatelliteInfo(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    func: () => JSON.stringify({
      property: window?._satellite?.property?.name || "",
      environment: window?._satellite?.environment?.stage || "",
      buildtime: window?._satellite?.buildInfo?.buildDate || ""
    }),
    args: [],
    target: {
      tabId: tabId || (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id
    },
    world: 'MAIN',
  });
  return result;
}

async function sendToTab(msg, tabIdFromOutside) {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tabId = tabIdFromOutside || tab.id;
  for (let retry = 0; retry < 20; retry++) {
    try {
      return await chrome.tabs.sendMessage(tabId, msg, { frameId: 0 });
    } catch (err) {
      if (!err.message.includes('Receiving end does not exist')) throw err;
    }
  }
}

function checkSettings(e) {
  chrome.storage.sync.get('settings', function (data) {
    const settings = data?.settings || {};
    settings.aabox = settings.aabox ?? true;
    settings.mainExpand = settings.mainExpand ?? false;
    settings.varsExpand = settings.varsExpand ?? true;
    settings.contextVarsExpand = settings.contextVarsExpand ?? false;
    settings.launchbox = settings.launchbox ?? false;
    settings.sessionRedirections = settings.sessionRedirections ?? true;
    settings.logAllWebSDK = settings.logAllWebSDK ?? false;
    settings.logBoringFieldsWebSDK = settings.logBoringFieldsWebSDK ?? false;
    settings.logDataObject = settings.logDataObject ?? false;
    settings.enableLaunchUIImprovements = settings.enableLaunchUIImprovements ?? true;
    chrome.storage.sync.set({ settings: settings });
  });
}

function universalPostParser(info) {
  if (info?.requestBody?.raw?.length > 0) { //for when a browser has no clue these are trivial key-value pairs.
    return String.fromCharCode.apply(null, new Uint8Array(info.requestBody.raw[0].bytes));
  } else if (info?.requestBody?.formData) { //for when a browser notices that these are trivial key-value pairs. FF does it. Chrome's algo is broken.
    return Object.keys(info.requestBody.formData).reduce((acc, currKey) => acc + currKey + `=` + encodeURIComponent(info.requestBody.formData[currKey]) + "&", "").slice(0, -1);
  } else {
    return false;
  }
}