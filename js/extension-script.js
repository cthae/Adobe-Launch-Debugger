document.addEventListener('DOMContentLoaded', async () => {
  const client = {};
  client.timing = JSON.parse(await getTiming());
  client._satellite = JSON.parse(await getPageVar('_satellite'));
  client.serverCalls = JSON.parse(await getAACalls());
  console.log("@@@ DEBUGGING: timing is ", client.timing);
  console.log("@@@ DEBUGGING: _satellite is ", client._satellite);
  console.log("@@@ DEBUGGING: AA Calls: ", client.serverCalls);
  client.pvs = client.serverCalls.filter((url) => {
    return !/pe=lnk/i.test(url.name)
  });
  client.links = client.serverCalls.filter((url) => {
    return /pe=lnk/i.test(url.name)
  });
  client.pageLoadTime = client.timing.domContentLoadedEventEnd - client.timing.navigationStart;

  updatePage(await statusCheck(client._satellite, client.pageLoadTime, client.pvs.length, client.links.length));
});

async function updatePage(launchDebugInfo){
  settingsLoad();
  Object.keys(launchDebugInfo).forEach((launchDebugItem) => {
    let reportElement = document.getElementById(launchDebugItem);
    reportElement.className = '';
    reportElement.classList.add(launchDebugInfo[launchDebugItem].class);
    reportElement.innerText = launchDebugInfo[launchDebugItem].value;
    reportElement.parentElement.setAttribute("title", launchDebugInfo[launchDebugItem].info)
  });
}

async function getContainer() {
  const [{result}] = await chrome.scripting.executeScript({
    func: () => JSON.stringify(_satellite._container),
    args: [],
    target: {
      tabId: (await chrome.tabs.query({active: true, currentWindow: true}))[0].id
    },
    world: 'MAIN',
  });
  return result;
}

async function getAACalls() {
  const [{result}] = await chrome.scripting.executeScript({
    func: () => JSON.stringify(performance.getEntriesByType("resource").filter((obj) => {return /b\/ss/i.test(obj.name)})),
    args: [],
    target: {
      tabId: (await chrome.tabs.query({active: true, currentWindow: true}))[0].id
    },
    world: 'MAIN',
  });
  return result;
}

async function getTiming() {
  const [{result}] = await chrome.scripting.executeScript({
    func: () => JSON.stringify(window["performance"]["timing"]),
    args: [],
    target: {
      tabId: (await chrome.tabs.query({active: true, currentWindow: true}))[0].id
    },
    world: 'MAIN',
  });
  return result;
}

async function getPageVar(name, tabId) {
  const [{result}] = await chrome.scripting.executeScript({
    func: name => JSON.stringify(window[name]),
    args: [name],
    target: {
      tabId: tabId ??
        (await chrome.tabs.query({active: true, currentWindow: true}))[0].id
    },
    world: 'MAIN',
  });
  return result;
}

async function statusCheck(_satellite, pageLoadTime, pvsNumber, linksNumber){
  let dataLayer = [];
  let dlEvent = {};
  const details = {
    pstatus: {},
    lstatus: {},
    pname: {},
    env: {},
    bdate: {},
    pvsNumber: {},
    linksNumber: {},
    dl: {},
    dlevent: {}
  };
  if (pageLoadTime > 0){
    details.pstatus = {
      value: "Loaded in " + pageLoadTime/1000 + " sec.",
      class: "success",
      info: "Loaded successfully"
    }
  } else {
    details.pstatus = {
      value: "Not Loaded Yet",
      class: "warn",
      info: "The page is still loading. Seems like the window.performance.timing.domContentLoadedEventEnd hasn't fired yet."
    }
  }
  if (typeof _satellite !== 'undefined' && _satellite && typeof _satellite === "object"){
    _satellite._container = JSON.parse(await getContainer());
    details.lstatus = {
      value: "Found",
      class: "success",
      info: "_satellite is defined and is an object."
    };
    if (_satellite.property && typeof _satellite.property.name === "string"){
      details.pname = {
        value: _satellite.property.name,
        class: "success",
        info: "We're good. The property name is there."
      };
    } else {
      details.pname = {
        value: "Not Found",
        class: "warn",
        info: "_satellite.property has some issues."
      };
    }
    if (typeof _satellite.environment === 'object'){
      if (_satellite.environment.stage === 'production'){
        details.env = {
          value: "Production",
          class: "success",
          info: "Production library is currently loaded."
        };
      } else if (_satellite.environment.stage !== 'production'){
        details.env = {
          value: "Development",
          class: "warn",
          info: "Lower env library is currently loaded."
        };
      }
    } else {
      details.env = {
        value: "ERROR",
        class: "error",
        info: "Environment is not defined despite _satellite being loaded. Something must be interfering with the _satellite object."
      };
    }
    if (_satellite.buildInfo && _satellite.buildInfo.buildDate){
      details.bdate = {
        value: formattedTimeSinceLastBuild(_satellite) + " Ago",
        class: "success",
        info: "How long since the current library's last build. If it's prod, then it's time since last publish, essentially."
      };
    } else {
      details.bdate = {
        value: "ERROR",
        class: "error",
        info: "Build info is not defined despite _satellite being loaded. Something must be interfering with the _satellite object."
      };
    }
    if (pvsNumber > 0){
      details.pvsNumber = {
        value: pvsNumber,
        class: "success",
        info: "Number of PageViews detected by now"
      }
    } else {
      details.pvsNumber = {
        value: pvsNumber,
        class: "warn",
        info: "No PageViews yet"
      }
    }
    if (linksNumber > 0){
      details.linksNumber = {
        value: linksNumber,
        class: "success",
        info: "Number of Links detected by now"
      }
    } else {
      details.linksNumber = {
        value: linksNumber,
        class: "warn",
        info: "No Links yet"
      }
    }
    if (_satellite._container && _satellite._container.extensions){
      if (_satellite._container.extensions["data-layer-manager-search-discovery"]){
        details.dl = {
          value: "DM's DL Found: " + _satellite._container.extensions["data-layer-manager-search-discovery"].settings.dataLayerObjectName,
          class: "success",
          info: "Data Layer Manager from Search Discovery was successfully detected!"
        } 
        dataLayer = JSON.parse(await getPageVar(_satellite._container.extensions["data-layer-manager-search-discovery"].settings.dataLayerObjectName));
      } else if(_satellite._container.extensions["gcoe-adobe-client-data-layer"]) {
        details.dl = {
          value: "ACDL's DL Found: " + _satellite._container.extensions["gcoe-adobe-client-data-layer"].settings.dataLayerName,
          class: "success",
          info: "ACDL was successfully detected!"
        } 
        dataLayer = JSON.parse(await getPageVar(_satellite._container.extensions["gcoe-adobe-client-data-layer"].settings.dataLayerName));
      } else if(_satellite._container.extensions["adobegoogledatalayer"]) {
        details.dl = {
          value: "GTM's DL Found: " + _satellite._container.extensions["adobegoogledatalayer"].settings.dataLayer,
          class: "success",
          info: "GTM DL's extension was successfully detected!"
        }
        dataLayer = JSON.parse(await getPageVar(_satellite._container.extensions["adobegoogledatalayer"].settings.dataLayer));
      } else {
        details.dl = {
          value: "No DL Extension",
          class: "warn",
          info: "No DL has been detected."
        }
        details.dlevent = {
          value: "No DL Extension",
          class: "warn",
          info: "No DL has been detected."
        }
      }
      dlEvent = dataLayer.filter((obj)=>{
        return obj.event && !/gtm\./i.test(obj.event);
      }).slice(-1)[0];
      if(dlEvent){
        details.dlevent = {
          value: dlEvent.event,
          class: "success",
          info: "Last event that is not a 'gtm.' event :)"
        }
      } else {
        details.dlevent = {
          value: "No events",
          class: "warn",
          info: "DL is found, but it doesn't contain non-gtm events."
        }
      }
    } else {
      details.dl = details.dlevent = {
        value: "No Container",
        class: "error",
        info: "No _satellite._container has been found."
      }
    }
  } else {
    details.lstatus.value = "Not Found";
    details.lstatus.class = "error";
    details.lstatus.info = "_satellite is not an object";
    details.env.value = details.bdate.value = details.pname.value = 
      details.linksNumber.value = details.pvsNumber.value = details.dl.value = 
      details.dlevent.value = "N/A";
    details.env.class = details.bdate.class = details.pname.class = 
      details.linksNumber.class = details.pvsNumber.class = details.dl.class = 
      details.dlevent.class = "warn";
    details.env.info = details.bdate.info = details.pname.info = 
      details.linksNumber.info = details.pvsNumber.info = details.dl.info = 
      details.dlevent.info = "Since _satellite is not there, no wonder this is not there either, heh.";
  }
  return details;
}

function formattedTimeSinceLastBuild(_satellite) {
  var ms = new Date() - new Date(_satellite.buildInfo.buildDate);
  let seconds = (ms / 1000).toFixed(1);
  let minutes = (ms / (1000 * 60)).toFixed(1);
  let hours = (ms / (1000 * 60 * 60)).toFixed(1);
  let days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
  if (seconds < 60) return seconds + " Sec";
  else if (minutes < 60) return minutes + " Min";
  else if (hours < 24) return hours + " Hrs";
  else return days + " Days";
}

async function settingsLoad() {
  chrome.storage.sync.get('aabox', function (data) {
    if (data) {
      if (data.aabox === true) {
        document.getElementById("aabox").checked = true;
      } else if (data.aabox === false) {
        document.getElementById("aabox").checked = false;
      }
    }
  }); 
  chrome.storage.sync.get('launchbox', function (data) {
    if (data) {
      if (data.launchbox === true) {
        document.getElementById("launchbox").checked = true;
      } else if (data.launchbox === false) {
        document.getElementById("launchbox").checked = false;
      }
    }
  });
}

function settingsSetter(){
  document.getElementById("aabox").addEventListener('change', function() {
    if (this.checked) {
      chrome.storage.sync.set({ "aabox": true });
    } else {
      chrome.storage.sync.set({ "aabox": false });
    }
  });
  document.getElementById("launchbox").addEventListener('change', function() {
    if (this.checked) {
      chrome.storage.sync.set({ "launchbox": true });
    } else {
      chrome.storage.sync.set({ "launchbox": false });
    }
  });
}