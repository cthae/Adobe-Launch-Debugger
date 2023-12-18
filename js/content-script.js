chrome.runtime.onMessage.addListener(info => {
  chrome.storage.sync.get('settings', function (data) {
    if (data?.settings?.aabox !== false) {
      console.log("@@@ Debugging: The Info object is: ", info);
      if (info.postPayload) {
        logServerCall(decodeURIComponent(info.info.url) + info.postPayload, info?._satelliteInfo, data.settings);
      } else {
        logServerCall(decodeURIComponent(info.info.url), info?._satelliteInfo, data.settings);
      }
    }
  });
});

chrome.storage.sync.get('settings', async function (data) {
  if (data?.settings?.launchbox !== false) {
    talkToBG({ type: 'setDebug', value: 1 });
  } else {
    talkToBG({ type: 'setDebug', value: 0 });
  }
});

function talkToBG(message) {
  chrome.runtime.sendMessage(message);
}

function logServerCall(fullURL, _satelliteInfo, settings) {
  document.sCallCounter = document.sCallCounter ? document.sCallCounter + 1 : 1;
  const parsingResult = parseServerCall(fullURL);
  let cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 500;font-size: 1.2em; background-color: Green; color: yellow`;
  let cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; background-color: Green; color: #fc0`;
  let sCallType = 'Page View';
  let sCallName = parsingResult.pageName;
  if (parsingResult.customLinkType) {
    parsingResult.customLinkType === 'lnk_o' ? sCallType = "Custom Link" : "";
    parsingResult.customLinkType === 'lnk_e' ? sCallType = "Exit Link" : "";
    parsingResult.customLinkType === 'lnk_d' ? sCallType = "Download Link" : "";
    cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 500;font-size: 1.2em; background-color: DarkSlateBlue; color: pink`;
    cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; background-color: DarkSlateBlue; color: #fc0`;
    sCallName = parsingResult.customLinkName;
  }
  const pNameMessage = sCallType + " Name : %c" + sCallName;
  const eventsMessage = `%cEvents: %c${parsingResult.events ? parsingResult.events : "No Events"}`;
  const RSMessage = `%cReport Suite: %c${parsingResult.rSuite ? parsingResult.rSuite : "No RS Found"}`
  if(settings?.mainExpand === true){
    console.group(`%cAA #${document.sCallCounter} ${pNameMessage}\n` + eventsMessage + " " + RSMessage,
      cssHeadField, cssHeadValue, cssHeadField, cssHeadValue, cssHeadField, cssHeadValue);
  } else {
    console.groupCollapsed(`%cAA #${document.sCallCounter} ${pNameMessage}\n` + eventsMessage + " " + RSMessage,
      cssHeadField, cssHeadValue, cssHeadField, cssHeadValue, cssHeadField, cssHeadValue);
  }
  printProducts(parsingResult.products);
  printMisc(parsingResult.pageName, parsingResult.pageType, parsingResult.campaign, parsingResult.currency, parsingResult.allHierarchy, parsingResult.siteSection)
  printVars(parsingResult.allListVars, "ListVars");
  printVars(parsingResult.alleVars, "eVars", settings.varsExpand);
  printVars(parsingResult.allProps, "props", settings.varsExpand);
  printOther(parsingResult.url2 ? parsingResult.url + parsingResult.url2 : parsingResult.url,
    parsingResult.server, _satelliteInfo.property, _satelliteInfo.environment, _satelliteInfo.buildtime);
  console.groupEnd();
}

function printOther(url, server, property, environment, buildDate) {
  if (!url && !server && !property && !environment && !buildDate) {
    return false;
  }
  console.group(`Other:${url ? ' URL,' : ""}${server ? ' Server,' : ""}` +
    `${property ? ' Property,' : ""}${environment ? ' Environment,' : ""}${buildDate ? ' buildDate,' : ""}`);
  printOne("URL        ", url);
  printOne("Server     ", server);
  printOne("Property   ", property);
  printOne("Environment", environment);
  printOne("Build Date ", buildDate);
  console.groupEnd();
  return true;
}

function printVars(vars, name, printExpanded = true) {
  if (vars.length === 0) {
    return false;
  }
  if (printExpanded){
    console.group(name + ": " + vars.length);
  } else {
    console.groupCollapsed(name + ": " + vars.length);
  }
  var varString = "";
  vars.forEach((param) => {
    varString += param.replace(/^(\w\d\d\d)=/, "$1 : ").replace(/(\w\d\d)=/, "$1  : ").replace(/(\w\d)=/, "$1   : ") + "\n";
  });
  console.log(varString.slice(0, -1));
  console.groupEnd();//close the Misc section
  return true;
}

function printMisc(pName, pType, campaign, currency, hierarchies, siteSection) {
  if (!pName && !pType && !campaign && !currency && !hierarchies) {
    return false;
  }
  console.group((`Misc: ${pName ? "PageName," : ""}${pType ? " PageType," : ""}${siteSection ? " Site Section," : ""}` +
    `${campaign ? " Campaign," : ""}${currency ? " Currency," : ""}` +
    `${hierarchies && hierarchies.length > 0 ? " Hierarchy," : ""}`).slice(0, -1));
  printOne("Page Name   ", pName);
  printOne("Page Type   ", pType);
  printOne("Site Section", siteSection);
  printOne("Campaign    ", campaign);
  printOne("Currency    ", currency);
  if (hierarchies.length > 0) {
    let hierarchiesString = '';
    hierarchies.forEach((h) => {
      hierarchiesString += h.replace("=", "  : ").replace("h", "Hierarchy ") + "\n";
    })
    console.log(hierarchiesString.slice(0, -1));
  }
  console.groupEnd();//close the Misc section
  return true;
}

function printProducts(productString) {
  if (!productString || productString.length === 0) {
    return false;
  }
  //console.log("@@@ Debugging product string:", productString);
  const products = productString.split(",");
  console.group("Products: " + products.length);
  products.forEach((product) => {
    console.log(`Category   : ${product.split(";")[0] ? product.split(";")[0] : '[Not Set]'}\n` + 
                `Name       : ${product.split(";")[1] ? product.split(";")[1] : '[Not Set]'}\n` + 
                `Quantity   : ${product.split(";")[2] ? product.split(";")[2] : '[Not Set]'}\n` + 
                `Price      : ${product.split(";")[3] ? product.split(";")[3] : '[Not Set]'}\n` + 
                `Events     : ${product.split(";")[4] ? product.split(";")[4] : '[Not Set]'}\n` + 
                `Merch.Vars : ${product.split(";")[5] ? product.split(";")[5] : '[Not Set]'}\n`);
  });
  console.groupEnd();//close the Products section
  return true;
}

function printOne(name, val) {
  if (val) {
    console.log(name + " : " + val);
    return true;
  } else {
    return false;
  }
}

function parseServerCall(fullURL) {
  //This function is awful. Rewrite it completely. At some point.
  const parsingResult = {};
  const allParams = fullURL.split("&");
  parsingResult.allProps = allParams.filter(param => {
    return /^c\d?\d?\d=/.test(param);
  });
  parsingResult.alleVars = allParams.filter(param => {
    return /^v[1-9]\d?\d?=/.test(param);
  });
  parsingResult.allListVars = allParams.filter(param => {
    return /^l\d=/.test(param);
  });
  parsingResult.allHierarchy = allParams.filter(param => {
    return /^h\d=/.test(param);
  });
  parsingResult.rSuite = allParams[0].match(/b\/ss\/([^\/]+)\//)[1];
  parsingResult.events = getComponent(allParams, "events");
  parsingResult.campaign = getComponent(allParams, "v0");
  parsingResult.pageName = getComponent(allParams, "pageName");
  parsingResult.pageType = getComponent(allParams, "pageType");
  parsingResult.server = getComponent(allParams, "server");
  parsingResult.url = getComponent(allParams, "g");
  parsingResult.url2 = getComponent(allParams, "-g");
  parsingResult.currencyCode = getComponent(allParams, "cc");
  parsingResult.products = getComponent(allParams, "products");
  parsingResult.visitorId = getComponent(allParams, "aid");
  parsingResult.customLinkType = getComponent(allParams, "pe");
  parsingResult.customLinkUrl = getComponent(allParams, "pev1");
  parsingResult.customLinkName = getComponent(allParams, "pev2");
  parsingResult.siteSection = getComponent(allParams, "ch");
  return parsingResult;
}

function getComponent(allParams, paramName) {
  const regexp = new RegExp("^" + paramName + "=");
  const foundElement = allParams.find(param => regexp.test(param));
  if (typeof foundElement === "undefined") {
    return false;
  }
  return foundElement?.split(/=(.+)?/, 2)[1];
}