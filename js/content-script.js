chrome.storage.sync.get('settings', function (data) {
  if (data?.settings?.launchbox !== false) {
    talkToBG({ type: 'setDebug', value: 1 });
  } else {
    talkToBG({ type: 'setDebug', value: 0 });
  }
});

chrome.runtime.onMessage.addListener(request => {
  chrome.storage.sync.get('settings', function (data) {
    if (data?.settings?.aabox !== false) {
      //console.log("@@@ Debugging: The Info object is: ", request);
      if(request.type === "AA"){
        if(request.postPayload) {
          logAAServerCall(decodeURIComponent(request.info.url) + request.postPayload, request?._satelliteInfo, data.settings, request.info?.error);
        } else {
          logAAServerCall(decodeURIComponent(request.info.url), request?._satelliteInfo, data.settings, request.info?.error);
        }
      } else if(request.type === "webSDK"){
        //console.log("@@@ Debugging: webSDK Detected! The Info object is: ", request);
        logWebSDKServerCall(JSON.parse(request.postPayload), data.settings);
      }
    }
  });
});

function talkToBG(message) {
  chrome.runtime.sendMessage(message);
}

function logAAServerCall(fullURL, _satelliteInfo, settings, networkError) {
  document.sCallCounter = document.sCallCounter ? document.sCallCounter + 1 : 1;
  const parsingResult = parseAAServerCall(fullURL);
  let cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 500;font-size: 1.2em; background-color: Green; color: yellow`;
  let cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; background-color: Green; color: #fc0`;
  let sCallType = 'Page View';
  let sCallName = parsingResult.pageName ? parsingResult.pageName : "[No Page Name]";
  if (parsingResult.customLinkType) {
    parsingResult.customLinkType === 'lnk_o' ? sCallType = "Custom Link" : "";
    parsingResult.customLinkType === 'lnk_e' ? sCallType = "Exit Link" : "";
    parsingResult.customLinkType === 'lnk_d' ? sCallType = "Download Link" : "";
    cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 500;font-size: 1.2em; background-color: DarkSlateBlue; color: pink`;
    cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; background-color: DarkSlateBlue; color: #fc0`;
    sCallName = parsingResult.customLinkName ? parsingResult.customLinkName : "[No Link Name]";
  }
  if(networkError){
    cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 500;font-size: 1.2em; background-color: Red; color: black`;
    cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; background-color: Red; color: black`;
  }
  const pNameMessage = sCallType + " Name : %c" + sCallName;
  const eventsMessage = `%cEvents: %c${parsingResult.events ? parsingResult.events : "[No Events]"}`;
  const RSMessage = `%cReport Suite: %c${parsingResult.rSuite ? parsingResult.rSuite : "[No RS Found]"}`;
  if(settings?.mainExpand === true){
    console.group(`${networkError ? "%cERROR: " + networkError + "\n" : "%c"}` + 
      `AA #${document.sCallCounter} ${pNameMessage}\n` + 
      eventsMessage + " " + RSMessage,
      cssHeadField, cssHeadValue, cssHeadField, cssHeadValue, cssHeadField, cssHeadValue);
  } else {
    console.groupCollapsed(`${networkError ? "%cERROR: " + networkError + "\n" : "%c"}` + 
      `AA #${document.sCallCounter} ${pNameMessage}\n` + 
      eventsMessage + " " + RSMessage,
      cssHeadField, cssHeadValue, cssHeadField, cssHeadValue, cssHeadField, cssHeadValue);
  }
  printProducts(parsingResult.products, parsingResult.events);
  printMisc(parsingResult.pageName, parsingResult.pageType, parsingResult.campaign, parsingResult.currency, parsingResult.allHierarchy, parsingResult.siteSection)
  printVars(parsingResult.allListVars, "ListVars");
  printVars(parsingResult.alleVars, "eVars", settings.varsExpand);
  printVars(parsingResult.allProps, "props", settings.varsExpand);
  printContext(parsingResult.contextVars, settings);
  printOther(parsingResult.url2 ? parsingResult.url + parsingResult.url2 : parsingResult.url,
    parsingResult.server, _satelliteInfo.property, _satelliteInfo.environment, _satelliteInfo.buildtime);
  console.groupEnd();
}

function printContext(contextVars, settings){
  if (contextVars.length === 0){
    console.groupCollapsed(`Context Vars: No context variables were found.`);
  } else{
    if (settings?.contextVarsExpand){
      console.group(`Context Vars: ${contextVars.length} variables found`);
    } else {
      console.groupCollapsed(`Context Vars: ${contextVars.length} variables found`);
    }
    contextVars.forEach((contextVar => {
      console.log (contextVar.replace("=", " = "));
    }));
  }
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

function printProducts(productString, globalEvents) {
  //console.log("@@@ DEBUGGING: ", productString);
  if (!productString || productString.length === 0) {
    return false;
  }
  cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; background-color: Red; color: black`;
  //console.log("@@@ Debugging product string:", productString);
  const products = productString.split(",");
  console.group("Products: " + products.length);
  products.forEach((product) => {
    const prodEventsContainer = product.split(";")[4] ? getProductEvents(product.split(";")[4], globalEvents) : {};
    if(prodEventsContainer?.areRogueEventsPresent){
      console.log(`Category   : ${product.split(";")[0] ? product.split(";")[0] : '[Not Set]'}\n` + 
        `Name       : ${product.split(";")[1] ? product.split(";")[1] : '[Not Set]'}\n` + 
        `Quantity   : ${product.split(";")[2] ? product.split(";")[2] : '[Not Set]'}\n` + 
        `Price      : ${product.split(";")[3] ? product.split(";")[3] : '[Not Set]'}\n` + 
        `Events     : ${prodEventsContainer?.events ? prodEventsContainer.events : '[Not Set]'}\n` + 
        `Merch.Vars : ${product.split(";")[5] ? product.split(";")[5].split("|").join(", ") : '[Not Set]'}\n` + 
        `%cSome events won't pop in AA cuz Adobe is weird and requires merch events to also be in s.events%c`
        ,"background-color: Red; color: black", "", "background-color: Red; color: black", ""
      );
    } else {
      console.log(`Category   : ${product.split(";")[0] ? product.split(";")[0] : '[Not Set]'}\n` + 
        `Name       : ${product.split(";")[1] ? product.split(";")[1] : '[Not Set]'}\n` + 
        `Quantity   : ${product.split(";")[2] ? product.split(";")[2] : '[Not Set]'}\n` + 
        `Price      : ${product.split(";")[3] ? product.split(";")[3] : '[Not Set]'}\n` + 
        `Events     : ${prodEventsContainer?.events ? prodEventsContainer?.events : '[Not Set]'}\n` + 
        `Merch.Vars : ${product.split(";")[5] ? product.split(";")[5].split("|").join(", ") : '[Not Set]'}`
      );
    }
  });
  console.groupEnd(); //close the Products section
  return true;
}

function getProductEvents(prodEvents, globalEvents){
  const result = {};
  if(prodEvents.length < 7){
    return {
      events: prodEvents,
      wrongEvents: false
    }
  }
  const rogueEvents = prodEvents.split("|").filter(prodEvent => {
    return globalEvents.indexOf(prodEvent.split("=")[0].split(":")[0]) === -1;
  });
  if(rogueEvents.length > 0){
    const presentEvents = prodEvents.split("|").filter(prodEvent => {
      return globalEvents.indexOf(prodEvent.split("=")[0].split(":")[0]) !== -1;
    });
    result.events = "%c" + rogueEvents.join(", ") + "%c" + 
      (presentEvents.length > 0 ? ", " + presentEvents.join(", ") : "");
    result.areRogueEventsPresent = true;
  } else {
    result.events = prodEvents;
    result.areRogueEventsPresent = false;
  }
  return result;
}

function printOne(name, val) {
  if (val) {
    console.log(name + " : " + val);
    return true;
  } else {
    return false;
  }
}

function parseAAServerCall(fullURL) {
  //This function is awful. Rewrite it completely. At some point.
  const parsingResult = {};
  parsingResult.contextVars = getContextVars(fullURL);
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

function getContextVars(fullURL){
  if (fullURL.indexOf("&c.&") > 0 && fullURL.indexOf("&.c&") > 0){
    try{
      return fullURL.split("&c.&")[1].split("&.c&")[0].split("&");
    } catch {
      return [];  
    }
  } else {
    return [];
  }
}

function getComponent(allParams, paramName) {
  const regexp = new RegExp("^" + paramName + "=");
  const foundElement = allParams.find(param => regexp.test(param));
  if (typeof foundElement === "undefined") {
    return false;
  }
  return foundElement?.split(/=(.+)?/, 2)[1];
}

function logWebSDKServerCall(postPayload, settings, networkError) {
  postPayload.events.forEach((WSEvent) => {
    const parsingResult = {};
    document.wSDKCounter = document.wSDKCounter ? document.wSDKCounter + 1 : 1;
    let cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 500;font-size: 1.2em; background-color: DarkCyan; color: yellow`;
    let cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; background-color: DarkCyan; color: #fc0`;
    const sCallName = WSEvent.xdm?.web?.webPageDetails?.name ? WSEvent.xdm.web.webPageDetails.name : "[No Page Name]";
    const scType = WSEvent.xdm?.eventType || "[No Web SDK Type]";
    if (networkError) {
      cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 500;font-size: 1.2em; background-color: Red; color: black`;
      cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; background-color: Red; color: black`;
    }
    const pNameMessage = scType + " Name : %c" + sCallName;
    if (settings?.mainExpand === true) {
      console.group(`${networkError ? "%cERROR: " + networkError + "\n" : "%c"}` +
        `Web SDK #${document.wSDKCounter} ${pNameMessage}\n`,
        cssHeadField, cssHeadValue);
    } else {
      console.groupCollapsed(`${networkError ? "%cERROR: " + networkError + "\n" : "%c"}` +
        `Web SDK #${document.wSDKCounter} ${pNameMessage}\n`,
        cssHeadField, cssHeadValue);
    }
    try {
      /*
      console.log(WSEvent.xdm.endUserIDs);
      console.log(WSEvent.xdm.marketing);
      console.log(WSEvent.xdm.webPageDetails);
      console.log(WSEvent.xdm._experience);
      console.log(WSEvent.xdm._uhc);
      */
      Object.keys(WSEvent.xdm).forEach((field) => {
        let cssInnerStyle = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; background-color: Yellow; color: black`;
        console.group("%c" + field, cssInnerStyle);
        console.log(WSEvent.xdm[field]);
        console.groupEnd();
      });
    } catch (e){
      console.error(e);
    }
    console.groupEnd();
  });
}