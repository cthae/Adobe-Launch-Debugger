document.addEventListener('DOMContentLoaded', async () => {
  loadSettings();
  deployClickListeners();
  const client = await getValuesFromClient();
  updatePage(await checkStatus(client._satellite, client.pageLoadTime, client.pvs.length, client.links.length));
});

async function getValuesFromClient(){
  const client = {};
  client.timing = JSON.parse(await getTiming());
  client._satellite = JSON.parse(await getPageVar('_satellite'));
  client.serverCalls = JSON.parse(await getAACalls());
  client.pvs = client.serverCalls.filter((url) => {
    return !/pe=lnk/i.test(url.name);
  });
  client.links = client.serverCalls.filter((url) => {
    return /pe=lnk/i.test(url.name);
  });
  client.pageLoadTime = client.timing.domContentLoadedEventEnd - client.timing.navigationStart;
  return client;
}

function deployClickListeners() {
  document.querySelectorAll("button.tablinks").forEach((button) => {
    button.addEventListener("click", switchTab);
  });
  document.getElementById("setRedirection").addEventListener("click", setRedirection);
  document.getElementById("delAllRedirections").addEventListener("click", removeAllRedirections);
  document.getElementById("newlib").addEventListener("click", evnt => {event.target.innerText=""});
  document.getElementById("blockPageUnload").addEventListener("click", blockPageUnload);
  document.getElementById("OTCheckConsent").addEventListener("click", OTCheckConsent);
  document.getElementById("OTOpenManager").addEventListener("click", OTOpenManager);
  document.getElementById("OTRejectAll").addEventListener("click", OTRejectAll);
  document.getElementById("OTAllowAll").addEventListener("click", OTAllowAll);
  document.getElementById("raccoon").addEventListener("click", loveTheRaccoon);
}

function loveTheRaccoon(event){
  event.target.innerText = "😻";
  setTimeout(() => event.target.innerText = "🦝", 2000);
}

async function OTAllowAll(evnt){
  const result = await executeOnPage("", () => {
    if (typeof Optanon === "undefined"){
      return false;
    } else {
      Optanon.AllowAll();
      return true;
    }
  });
  if (result){
    evnt.target.classList = "success";
    evnt.target.innerText = "Done!";
  } else {
    evnt.target.classList = "error";
    evnt.target.innerText = "No Optanon!";
  }
}

async function OTRejectAll(evnt){
  const result = await executeOnPage("", () => {
    if (typeof Optanon === "undefined"){
      return false;
    } else {
      Optanon.RejectAll();
      return true;
    }
  });
  if (result){
    evnt.target.classList = "success";
    evnt.target.innerText = "Done!";
  } else {
    evnt.target.classList = "error";
    evnt.target.innerText = "No Optanon!";
  }
}

async function OTOpenManager(evnt){
  const result = await executeOnPage("", () => {
    if (typeof Optanon === "undefined"){
      return false;
    } else {
      Optanon.ToggleInfoDisplay();
      return true;
    }
  });
  if (result){
    evnt.target.classList = "success";
    evnt.target.innerText = "Done!";
  } else {
    evnt.target.classList = "error";
    evnt.target.innerText = "No Optanon!";
  }
}

function OTCheckConsent(evnt){
  evnt.target.classList = "success";
  evnt.target.innerText = "In the Console!";
  const result = executeOnPage("", () => {
    const color = {
      good: 'lime',
      bad: 'red',
      info: 'white',
      info2: 'yellow',
      data: 'lightgrey'
    }
    window.getCookie = function (name) {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      if (match) return match[2];
    }
    const fullCookie = window.getCookie("OptanonConsent");
    console.group("%c Consent check script initiated. \n", css(color.info));
    console.log("%c Total Cookies on this page: " + document.cookie.split(";").length, css(color.info2));
    console.log("%c The length of the OptanonConsent is " + (!fullCookie ? "0" : fullCookie.length), css(color.info2));
    console.log("%c The raw OptanonConsent is:", css(color.info2));
    console.log("%c " + fullCookie, css(color.data));
  
    if (!/groups/i.test(fullCookie)) {
      console.log("%c Consent is not recorded", css("red"));
      return;
    }
    console.log("%c \nThe Groups Breakdown:", css(color.info));
    console.log("%c NOTE! The default groups are: C0001 - Necessary; C0002 - Performance; C0003 - Functional; C0004 - Targeting. But they can be tweaked.", css("white"));
    decodeURIComponent(fullCookie.split("groups=")[1].split("&")[0]).split(",").forEach((groupPair) => {
      let c = groupPair.split(":")[1] === "1" ? color.good : color.bad;
      console.log("%c Group " + groupPair.split(":")[0] + " = " + groupPair.split(":")[1], css(c));
    });
    console.groupEnd()
    function css(c) {
      return `text-shadow: 1px 1px 1px ${c}, 0 0 1em ${c}, 0 0 0.2em ${c};color: ${c};font-weight: 500;font-size: 1.3em; background-color: dimgray`;
    }
  });
}

function blockPageUnload(evnt){
  evnt.target.classList = "success";
  evnt.target.innerText = "Done!";
  executeOnPage("", () => {
    window.onbeforeunload = () => false;
  });
}

function removeAllRedirections(){
  //kill all redirections from settings
  chrome.storage.sync.set({redirections:[]});
  //kill all redirections from the declarativeNetRequest
  deleteAllDeclarativeNetRequestRules();
  //finally, clear the table...
  const table = document.getElementsByClassName("redirectionsTable")[0];
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }
}

async function deleteAllDeclarativeNetRequestRules(){
  chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: (await chrome.declarativeNetRequest.getSessionRules()).map(rule => rule.id),
    addRules: []
  });
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: (await chrome.declarativeNetRequest.getDynamicRules()).map(rule => rule.id),
    addRules: []
  });
}

function getFirstValidUrl(text) {
  const urlRegex = /\bhttps?:\/\/[\w\.\/\-\#\?\&\:\=\@]+/gi;
  const matches = text.match(urlRegex);
  if (matches && matches.length > 0) {
    return matches[0];
  }
  return "[No Valid URL!]";
}

function setRedirection(){
  const date = new Date().toISOString().replace("T","\n").replace(/:\d\d\..+/,"");
  const redirectFrom = document.getElementById("currentlib");
  const redirectTo = document.getElementById("newlib");
  const CTA = document.getElementById("setRedirection");
  redirectFrom.value = getFirstValidUrl(redirectFrom.value);
  redirectTo.value = getFirstValidUrl(redirectTo.value);
  if(!/http/i.test(redirectFrom.value) || !/http/i.test(redirectTo.value)) {
    CTA.innerText = "ERROR"; 
    CTA.className = "error";
    return false;
  } else if (redirectFrom.value === redirectTo.value){
    CTA.innerText = "The URL is the same!";
    CTA.className = "error";
    return false;
  }
  
  chrome.storage.sync.get('redirections', function (data) {
    console.log("@@@ Redirections are ", data.redirections);
    redirections = data.redirections || [];
    if(!updateRedirectionIfExists(redirections, redirectFrom.value, redirectTo.value, date, CTA)){
      redirections.push({date: date, from: redirectFrom.value, to: redirectTo.value});
      CTA.innerText = "Rule Added!"; 
      CTA.className = "success";
    }
    //to catch the update happened in the for loop:
    chrome.storage.sync.set({redirections: redirections});
    updateRedirections(redirections);
  })
}

function updateRedirectionIfExists(redirections, redirectFrom, redirectTo, date, CTA){
  for (var i = 0; i < redirections.length; i++){
    if(redirections[i].from === redirectFrom){
      if(redirections[i].to === redirectTo){
        CTA.innerText = "Rule Exists!"; 
        CTA.className = "warn";
        return true;
      } else{
        CTA.innerText = "Rule Updated!"; 
        CTA.className = "success";
        redirections[i].to = redirectTo;
        redirections[i].date = date;
        return true;
      }
    }
  }
  return false;
}

function switchTab(event) {
  const tabName = event.target.name;
  document.querySelectorAll("div.tab").forEach((tab) => {
    if (tab.id === tabName) {
      tab.style.display = "block";
    } else {
      tab.style.display = "none";
    }
  });
  if (tabName === "Redirections"){
    renderRedirections();
  }
}

function renderRedirections(){
  const table = document.getElementsByClassName("redirectionsTable")[0];
  table.innerHTML = `<tbody>
  <tr>
     <th style = "text-align: center; vertical-align: middle;">Date</th>
     <th>From</th>
     <th>To</th>
     <th style = "text-align: center; vertical-align: middle;">Delete</th>
  </tr>
</tbody>`;
  chrome.storage.sync.get('redirections', function (data) {
    if (data.redirections){
      console.log("@@@ Redirections Exist, the obj is ", data.redirections);
      data.redirections.forEach(redirection => {
        const row = table.insertRow(-1);
        const td0 = row.insertCell(0);
        const td1 = row.insertCell(1);
        const td2 = row.insertCell(2);
        const td3 = row.insertCell(3);
        td0.innerText = redirection.date.replace("t","<br/>");
        td0.style = "text-align: center; vertical-align: middle;";
        td0.setAttribute("name", "date");
        td1.innerText = redirection.from;
        td1.setAttribute("name", "from");
        td2.innerText = redirection.to;
        td2.setAttribute("name", "to");
        td3.innerHTML = "<button name = 'deleteRedirection' class = 'error'>X</button>";
        td3.style = "text-align: center; vertical-align: middle;";
        td3.setAttribute("name", "delete");
      });
      deleteRedirectionButtonListener()
    } else {
      const row = table.insertRow;
      row.innerText = "No saved redirection rules found, sorry.";
      row.classList = "error";
    }
  });
}

function deleteRedirectionButtonListener(){
  buttons = document.getElementsByName("deleteRedirection");
  buttons.forEach(button => {
    button.addEventListener("click", clickEvent => {
      const row = clickEvent.target.parentElement.parentElement;
      const from = row.querySelector("[name='from']").innerText;
      deleteRedirection(from);
      row.remove();
    })
  })
}

function deleteRedirection(from){
  chrome.storage.sync.get('redirections', function (data) {
    const redirections = data.redirections.filter(redirection => redirection.from !== from);
    chrome.storage.sync.set({redirections:redirections});
    updateRedirections(redirections);
    console.log("@@@ Redirection " + from + " deleted! New redirections: ", redirections);
  });
}

async function updateRedirections(redirections) {
  chrome.storage.sync.get('settings', async function (data) {
    const newRules = redirections.map((redirect, index) => {
      let rule = {
        'id': index + 1,
        'priority': index + 1,
        'action': {
          'type': 'redirect',
          'redirect': {
            url: redirect.to
          }
        },
        'condition': {
          'urlFilter': redirect.from,
          'resourceTypes': [
            'script'
          ]
        }
      };
      console.log("The redirect rule is: ", rule);
      return rule;
    });
    if(data?.settings?.sessionRedirections !== false){
      chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: (await chrome.declarativeNetRequest.getSessionRules()).map(rule => rule.id),
        addRules: newRules
      });
    } else {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: (await chrome.declarativeNetRequest.getDynamicRules()).map(rule => rule.id),
        addRules: newRules
      });
    }
  });
}

async function updatePage(launchDebugInfo) {
  Object.keys(launchDebugInfo).forEach((launchDebugItem) => {
    let reportElement = document.getElementById(launchDebugItem);
    reportElement.className = '';
    reportElement.classList.add(launchDebugInfo[launchDebugItem].class);
    reportElement.innerHTML = launchDebugInfo[launchDebugItem].value;
    reportElement.parentElement.setAttribute("title", launchDebugInfo[launchDebugItem].info);
  });
  setStatusDependantListeners();
}

function setStatusDependantListeners(){
  const dlCell = document.getElementById("dl");
  const dlEvent = document.getElementById("dlevent");
  if (/dl found: /i.test(dlCell.innerText)){
    const dlName = dlCell.innerText.split(": ").slice(-1)[0];
    dlCell.addEventListener('click', (event) => {
      executeOnPage(dlName, function(dlName){console.log("Printing the Data Layer variable: " + dlName + " Last 20 events\n"); 
      console.log("{", ...Object.entries(window[dlName]).slice(-20).flatMap(([k, v]) => ["\n  " + k + ":", v]), "\n}")});//Thanks to Maxdamantus for this beauty.
    })
    if(!/no events/i.test(dlEvent.innerText)){
      dlEvent.addEventListener('click', (event) => {
        executeOnPage({dlEvent: dlEvent.innerText, dlName: dlName}, 
          function(dlData){
            console.log("Printing the last non-GTM DL variable " + dlData.dlEvent +":\n", 
              window[dlData.dlName].findLast((dlElement => {
                return dlElement.event === dlData.dlEvent;
              })))});
      })
    }
  }
}

async function getContainer() {
  const [{ result }] = await chrome.scripting.executeScript({
    func: () => JSON.stringify(_satellite._container),
    args: [],
    target: {
      tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id
    },
    world: 'MAIN',
  });
  return result;
}

async function getAACalls() {
  const [{ result }] = await chrome.scripting.executeScript({
    func: () => JSON.stringify(performance.getEntriesByType("resource").filter((obj) => { return /b\/ss/i.test(obj.name); })),
    args: [],
    target: {
      tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id
    },
    world: 'MAIN',
  });
  return result;
}

async function getTiming() {
  const [{ result }] = await chrome.scripting.executeScript({
    func: () => JSON.stringify(window["performance"]["timing"]),
    args: [],
    target: {
      tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id
    },
    world: 'MAIN',
  });
  return result;
}

async function executeOnPage(funcVar, funcToExecute) {
  const [{result}] = await chrome.scripting.executeScript({
    func: funcToExecute,
    args: [funcVar],
    target: {
      tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id
    },
    world: 'MAIN',
  });
  return result;
}

async function getPageVar(name, tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    func: name => JSON.stringify(window[name]),
    args: [name],
    target: {
      tabId: tabId ??
        (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id
    },
    world: 'MAIN',
  });
  return result;
}

async function getDLWithNoGTM(name) {
  const [{ result }] = await chrome.scripting.executeScript({
    func: name => JSON.stringify((window[name] || []).filter((dl) => {return dl.event && dl.event.indexOf("gtm.") === -1})),
    args: [name],
    target: {
      tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id
    },
    world: 'MAIN',
  });
  return result;
}

async function checkStatus(_satellite, pageLoadTime, pvsNumber, linksNumber) {
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
  if (pageLoadTime > 0) {
    details.pstatus = {
      value: "Loaded in " + pageLoadTime / 1000 + " sec.",
      class: "success",
      info: "Loaded successfully"
    };
  } else {
    details.pstatus = {
      value: "Not Loaded Yet",
      class: "warn",
      info: "The page is still loading. Seems like the window.performance.timing.domContentLoadedEventEnd hasn't fired yet."
    };
  }
  if (typeof _satellite !== 'undefined' && _satellite && typeof _satellite === "object") {
    _satellite._container = JSON.parse(await getContainer());
    details.lstatus = {
      value: "Found",
      class: "success",
      info: "_satellite is defined and is an object."
    };
    if (_satellite.property && typeof _satellite.property.name === "string") {
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
    if (typeof _satellite.environment === 'object') {
      const env =  _satellite.environment.stage;
      details.env = {
        value: env.charAt(0).toUpperCase() + env.slice(1),
        class: env === 'production' ? "success" : "warn",
        info: "Production library is currently loaded."
      };
    } else {
      details.env = {
        value: "ERROR",
        class: "error",
        info: "Environment is not defined despite _satellite being loaded. Something must be interfering with the _satellite object."
      };
    }
    if (_satellite.buildInfo && _satellite.buildInfo.buildDate) {
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
    if (pvsNumber > 0) {
      details.pvsNumber = {
        value: pvsNumber,
        class: "success",
        info: "Number of PageViews detected by now"
      };
    } else {
      details.pvsNumber = {
        value: pvsNumber,
        class: "warn",
        info: "No PageViews yet"
      };
    }
    if (linksNumber > 0) {
      details.linksNumber = {
        value: linksNumber,
        class: "success",
        info: "Number of Links detected by now"
      };
    } else {
      details.linksNumber = {
        value: linksNumber,
        class: "warn",
        info: "No Links yet"
      };
    }
    if (_satellite._container && _satellite._container.extensions) {
      if (_satellite._container.extensions["data-layer-manager-search-discovery"]) {
        details.dl = {
          value: "DM's DL Found: " + _satellite._container.extensions["data-layer-manager-search-discovery"].settings.dataLayerObjectName,
          class: "success",
          info: "Data Layer Manager from Search Discovery was successfully detected!"
        };
        dataLayer = await JSON.parse(await getDLWithNoGTM(_satellite._container.extensions["data-layer-manager-search-discovery"].settings.dataLayerObjectName));
      } else if (_satellite._container.extensions["gcoe-adobe-client-data-layer"]) {
        details.dl = {
          value: "ACDL's DL Found: " + _satellite._container.extensions["gcoe-adobe-client-data-layer"].settings.dataLayerName,
          class: "success",
          info: "ACDL was successfully detected!"
        };
        dataLayer = await JSON.parse(await getDLWithNoGTM(_satellite._container.extensions["gcoe-adobe-client-data-layer"].settings.dataLayerName));
      } else if (_satellite._container.extensions["adobegoogledatalayer"]) {
        details.dl = {
          value: "GTM's DL Found: " + _satellite._container.extensions["adobegoogledatalayer"].settings.dataLayer,
          class: "success",
          info: "GTM DL's extension was successfully detected!"
        };
        dataLayer = await JSON.parse(await getDLWithNoGTM(_satellite._container.extensions["adobegoogledatalayer"].settings.dataLayer));
      } else {
        details.dl = {
          value: "No DL Extension",
          class: "warn",
          info: "No DL has been detected."
        };
        details.dlevent = {
          value: "No DL Extension",
          class: "warn",
          info: "No DL has been detected."
        };
      }
      if (Array.isArray(dataLayer)){
        dlEvent = dataLayer.slice(-1)[0] || {event:"No events yet :)"};
      }
      if (dlEvent) {
        details.dlevent = {
          value: dlEvent.event,
          class: dlEvent === "No events yet :)" ? "warn" : "success",
          info: "Last event that is not a 'gtm.' event :)"
        };
      } else {
        details.dlevent = {
          value: "No events yet :)",
          class: "warn",
          info: "DL is found, but it doesn't contain non-gtm events."
        };
      }
    } else {
      details.dl = details.dlevent = {
        value: "No Container",
        class: "error",
        info: "No _satellite._container has been found."
      };
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
  const ms = new Date() - new Date(_satellite.buildInfo.buildDate);
  const seconds = (ms / 1000).toFixed(1);
  const minutes = (ms / (1000 * 60)).toFixed(1);
  const hours = (ms / (1000 * 60 * 60)).toFixed(1);
  const days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
  if (seconds < 60) return seconds + " Sec";
  else if (minutes < 60) return minutes + " Min";
  else if (hours < 24) return hours + " Hrs";
  else return days + " Days";
}

async function loadSettings() {
  chrome.storage.sync.get('redirections', function (data) {
    const redirections = data?.redirections || [];
    updateRedirections(redirections);
  });

  const settings = {};
  chrome.storage.sync.get('settings', function (data) {
    settingsSetter(data.settings);
    if (data.settings) {
      console.log("@@@ Settings Exist, the obj is ", data.settings);
      Object.keys(data.settings).forEach(setting => {
        document.getElementById(setting).checked = data.settings[setting];
      });
    } else {
      console.log("@@@ Settings Don't exist. Populating them with default vals. the obj is ", data.settings);
      document.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
        settings[checkbox.id] = checkbox.checked;
      });
      chrome.storage.sync.set({ settings: settings });
    }
  });
}

async function settingsSetter(settings) {
  document.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
    checkbox.addEventListener("click", (event) => {
      settings[event.target.id] = event.target.checked;
      chrome.storage.sync.set({ settings: settings });
      if(event.target.id === "launchbox"){
        executeOnPage(event.target.checked, (flag) => {
          localStorage.setItem("com.adobe.reactor.debug",!!flag); 
          typeof _satellite !== 'undefined' ? _satellite?.setDebug(!!flag) : '';
        });
      }
    })
  });

  const originalLaunchLib = await executeOnPage("", function(a){
    const launchLib = document.querySelector("script[src*='/launch-']") || document.querySelector("script[src*='/satelliteLib-']");
    return launchLib ? launchLib.src : false;
  });
  document.getElementById("currentlib").innerText = originalLaunchLib || "[No Launch Lib Detected]";
}

function logSettings(){
  chrome.storage.sync.get('settings', function (data) {
    console.log("@@@ Debugging the Settings object is: " , data.settings);
  });
}