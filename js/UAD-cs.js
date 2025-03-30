chrome.storage.sync.get('settings', function (data) {
  if (data?.settings?.launchbox !== false) {
    talkToBG({ type: 'setDebug', value: true });
  } else {
    talkToBG({ type: 'setDebug', value: false });
  }
});

chrome.runtime.onMessage.addListener(request => {
  chrome.storage.sync.get('settings', function (data) {
    if (data?.settings?.aabox !== false) {
      //console.log("@@@ Debugging: The Info object is: ", request);
      let error = "";
      if (request.info?.error)
        error = request.info?.error;
      else if (request.eventTriggered === "timeoutError") {
        error = "This request was sent, but the server didn't respond in six seconds, which indicates that this has likely not reached AA. Disable your Adblockers and check Throttling config.";
      }
      if (request.type === "AA") {
        if (request.postPayload) {
          logAAServerCall(request.info.url + request.postPayload, request?._satelliteInfo, data.settings, error);
        } else {
          logAAServerCall(request.info.url, request?._satelliteInfo, data.settings, error);
        }
      } else if (request.type === "webSDK") {
        //console.log("@@@ Debugging: webSDK Detected! The Info object is: ", request);
        logWebSDKServerCall(JSON.parse(request.postPayload || ""), data.settings, error, decodeURIComponent(request.info?.url || ""));
      } else if (request.type === "Beaconed webSDK") {
        logWebSDKBeaconCall(decodeURIComponent(request.info?.url || ""), data.settings);
      }
    }
  });
});

function logWebSDKBeaconCall(baseURL, settings) {
  document.wSDKCounter = document.wSDKCounter ? document.wSDKCounter + 1 : 1;
  const cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 500;font-size: 1.2em; background-color: DarkCyan; color: yellow`;
  const cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; background-color: DarkCyan; color: #fc0`;
  const cssNormal = `font-family: 'Courier New';font-weight: 400; font-size: 1.2em`;
  const cssBold = `font-family: 'Courier New';font-weight: 800; font-size: 1.4em; background-color: DarkCyan; color: #fc0`;
  let edgeConfigId = "[Not Found]";
  try {
    edgeConfigId = baseURL.split("configId=")[1]?.split(/\&|$/)[0]?.slice(0, 8);
  } catch (e) {
    edgeConfigId = e;
  }
  const mainLogHeader = `%cWeb SDK #${document.wSDKCounter}: %cBeacon Payload Detected!\n` +
    `%cEdge ID: %c${edgeConfigId}\n`;
  console.groupCollapsed(mainLogHeader, cssHeadField, cssHeadValue, cssHeadField, cssHeadValue);
  console.log("%cSorry, but no payload is available currently for ping type requests due to long-lived Chrome bug where it fails to give extensions the payload of ping POSTs in network listeners.\n\n" +
    "%cHowever!%c \n\nYou still can get access to it by simply looking in your Network tab. Don't forget to preserve log since the page will likely unload. Or, better yet, block unload. There's an option in the extensions' 'Snippets' tab. Adobe doesn't use the 'interact' endpoint for pings, however. They decided to use a different url.\n\n" +
    "Filter the Network tab by %c'collect?configId'%c and you'll get the pings.\n" +
    "What's the difference between beacons and normal requests? In Launch, in the Send Event action, you have an option called %c'Document will unload'%c.\n\n" +
    "Or if you use alloy directly to send events, it has a binary option called %c'documentUnloading'%c\nRead more about it here: https://experienceleague.adobe.com/en/docs/analytics/implementation/vars/config-vars/usebeacon\n\n" +
    "Technically, I could try using a different api to still get the payloads in the console, but I don't know if it's worth it given how normally the beacons are rarely used and they generally have low business value. Well let me know if you need it. Devtools chrome.debugger API may be fun.",
    cssNormal, cssBold, cssNormal, cssBold, cssNormal, cssBold, cssNormal, cssBold, cssNormal);
  console.log(`%c^^^ The end of the Server Call #${document.wSDKCounter} ^^^`, cssHeadValue)
  console.groupEnd();
}

function talkToBG(message) {
  chrome.runtime.sendMessage(message);
}

function logAAServerCall(fullURL, _satelliteInfo, settings, networkError) {
  const pvBackgroundColor = settings?.colors?.["aa-pv-bg"] || "#008000";
  const pvTextColor = settings?.colors?.["aa-pv-txt"] || "#FFFF00";
  const linkBackgroundColor = settings?.colors?.["aa-link-bg"] || "#483d8b";
  const errorBackgroundColor = settings?.colors?.["error-bg"] || "#FF0000";
  const errorTextColor = settings?.colors?.["error-txt"] || "#000000";
  document.sCallCounter = document.sCallCounter ? document.sCallCounter + 1 : 1;
  const parsingResult = parseAAServerCall(fullURL);
  let cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 500;font-size: 1.2em; background-color: ${pvBackgroundColor}; color: ${pvTextColor}`;
  let cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; background-color: ${pvBackgroundColor}; color: ${pvTextColor}`;
  let sCallType = 'Page View';
  let sCallName = parsingResult.pageName ? parsingResult.pageName : "[No Page Name]";
  if (parsingResult.customLinkType) {
    parsingResult.customLinkType === 'lnk_o' ? sCallType = "Custom Link" : "";
    parsingResult.customLinkType === 'lnk_e' ? sCallType = "Exit Link" : "";
    parsingResult.customLinkType === 'lnk_d' ? sCallType = "Download Link" : "";
    cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 500;font-size: 1.2em; background-color: ${linkBackgroundColor}; color: ${linkTextColor}`;
    cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; background-color: ${linkBackgroundColor}; color: ${linkTextColor}`;
    sCallName = parsingResult.customLinkName ? parsingResult.customLinkName : "[No Link Name]";
  }
  if (networkError) {
    cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 500;font-size: 1.2em; background-color: ${errorBackgroundColor}; color: ${errorTextColor}`;
    cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; background-color: ${errorBackgroundColor}; color: ${errorTextColor}`;
  }
  const pNameMessage = sCallType + " Name : %c" + sCallName;
  const eventsMessage = `%cEvents: %c${parsingResult.events ? parsingResult.events : "[No Events]"}`;
  const RSMessage = `%cReport Suite: %c${parsingResult.rSuite ? parsingResult.rSuite : "[No RS Found]"}`;
  if (settings?.mainExpand === true) {
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
  printProducts(parsingResult.products, parsingResult.events, parsingResult.transactionId);
  printMisc(parsingResult.pageName, parsingResult.pageType, parsingResult.campaign,
    parsingResult.currencyCode, parsingResult.allHierarchy, parsingResult.siteSection,
    parsingResult.zip)
  printVars(parsingResult.allListVars, "ListVars");
  printVars(parsingResult.alleVars, "eVars", settings.varsExpand);
  printVars(parsingResult.allProps, "props", settings.varsExpand);
  printContext(parsingResult.contextVars, settings);
  printOther(parsingResult.url2 ? parsingResult.url + parsingResult.url2 : parsingResult.url,
    parsingResult.server, _satelliteInfo.property, _satelliteInfo.environment,
    _satelliteInfo.buildtime, parsingResult.mcorgid, parsingResult.mid);
  console.log(`%c^^^ The end of the Server Call #${document.sCallCounter} ^^^`, cssHeadValue)
  console.groupEnd();
  logCustomAAFields(settings.loggingHeadings, fullURL, document.sCallCounter);
}

function logCustomAAFields(settings, fullURL, counter) {
  const customBackgroundColor = settings.colors?.["custom-bg"] || "#FFA500";
  const customTextColor = settings.colors?.["custom-txt"] || "#000000";
  const loggingHeadings = settings.loggingHeadings;
  if (loggingHeadings?.length > 0) {
    const cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 500;font-size: 1.2em; background-color: ${customBackgroundColor}; color: ${customTextColor}`;
    const cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 800;font-size: 1.2em; background-color: ${customBackgroundColor}; color: ${customTextColor}`;
    console.group(`%cAA #${counter} User-customized additional logging:`, cssHeadField);
    loggingHeadings.forEach(heading => {
      if (/^(event\d|e\d)/i.test(heading)) {
        heading = heading.replace(/^(e)(\d+)/i, "event$2");
        const headingVal = decodeURIComponent(fullURL.split("events=")[1].split("&")[0])?.//event string
          split(",")?.find(event => {
            return event.includes(heading+"=") || event === heading;
          })?.replace(heading, "").replace("=", "");
        console.log(`%c${heading} : %c${headingVal === "" ? " Found!" : headingVal}`, cssHeadValue, cssHeadField);
      } else {
        heading = heading.replace(/^prop/i, "c").replace(/^(p)(\d+)/i, "c$2").replace(/^evar/i, "v").replace(/^list/i, "l");
        console.log(`%c${heading} : %c${decodeURIComponent(fullURL.split(heading + "=")[1]?.split("&")[0])}`, cssHeadValue, cssHeadField);
      }
    });
    console.groupEnd();
  }
}

function printContext(contextVars, settings) {
  if (contextVars.length === 0) {
    console.groupCollapsed(`Context Vars: No context variables were found.`);
  } else {
    if (settings?.contextVarsExpand) {
      console.group(`Context Vars: ${contextVars.length} variables found`);
    } else {
      console.groupCollapsed(`Context Vars: ${contextVars.length} variables found`);
    }
    contextVars.forEach((contextVar => {
      console.log(contextVar.replace("=", " = "));
    }));
  }
  console.groupEnd();
}

function printOther(url, server, property, environment, buildDate, mcorgid, mid) {
  console.groupCollapsed(`Other:${url ? ' URL,' : ""}${server ? ' Server,' : ""}` +
    `${property ? ' Property,' : ""}${environment ? ' Environment,' : ""}` +
    `${mcorgid ? ' mcorgid,' : ""}${mid ? ' mid,' : ""}${buildDate ? ' buildDate,' : ""}`);
  printOne("URL        ", url);
  printOne("Server     ", server);
  printOne("Property   ", property);
  printOne("Environment", environment);
  printOne("mcorgid    ", mcorgid);
  printOne("MID        ", mid);
  printOne("Build Date ", buildDate);
  console.groupEnd();
  return true;
}

function printVars(vars, name, printExpanded = true) {
  if (vars.length === 0) {
    return false;
  }
  if (printExpanded) {
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

function printMisc(pName, pType, campaign, currency, hierarchies, siteSection, zip) {
  if (!pName && !pType && !campaign && !currency && !hierarchies) {
    return false;
  }
  console.group((`Misc: ${pName ? "PageName," : ""}${pType ? " PageType," : ""}${siteSection ? " Site Section," : ""}` +
    `${campaign ? " Campaign," : ""}${currency ? " Currency," : ""}` +
    `${zip ? " Zip," : ""}${currency ? " Currency," : ""}` +
    `${hierarchies && hierarchies.length > 0 ? " Hierarchy," : ""}`).slice(0, -1));
  printOne("Page Name   ", pName);
  printOne("Page Type   ", pType);
  printOne("Site Section", siteSection);
  printOne("Campaign    ", campaign);
  printOne("Currency    ", currency);
  printOne("Zip         ", zip);
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

function printProducts(productString, globalEvents, transactionId) {
  //console.log("@@@ DEBUGGING: ", productString);
  if (!productString || productString.length === 0) {
    return false;
  }
  //console.log("@@@ Debugging product string:", productString);
  const products = productString.split(",");
  const cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 600;font-size: 1.2em;background-color: Orange; color: black`;
  const cssError = `background-color: Red; color: black`;
  console.group("Products: " + products.length);
  products.forEach((product) => {
    const prodEventsContainer = product.split(";")[4] ? getProductEvents(product.split(";")[4], globalEvents) : {};
    if (prodEventsContainer?.areRogueEventsPresent) {
      console.log(`%cCategory   :%c ${product.split(";")[0] ? product.split(";")[0] : '[Not Set]'}\n` +
        `%cName       :%c ${product.split(";")[1] ? product.split(";")[1] : '[Not Set]'}\n` +
        `%cQuantity   :%c ${product.split(";")[2] ? product.split(";")[2] : '[Not Set]'}\n` +
        `%cPrice      :%c ${product.split(";")[3] ? product.split(";")[3] : '[Not Set]'}\n` +
        `%cEvents     :%c ${prodEventsContainer?.events ? prodEventsContainer.events : '[Not Set]'}\n` +
        `%cTrans. Id  :%c ${transactionId || '[Not Set]'}\n` +
        `%cMerch.Vars :%c ${product.split(";")[5] ? product.split(";")[5].split("|").join(", ") : '[Not Set]'}\n` +
        `🦝%cMerchandising events should be in s.events too, otherwise AA won't display them%c🦝`,
        cssHeadField, "", cssHeadField, "", cssHeadField, "", cssHeadField, "", cssHeadField, "", cssError, "", cssHeadField, "", cssHeadField, "", cssError, ""
      );
    } else {
      console.log(`%cCategory   :%c ${product.split(";")[0] ? product.split(";")[0] : '[Not Set]'}\n` +
        `%cName       :%c ${product.split(";")[1] ? product.split(";")[1] : '[Not Set]'}\n` +
        `%cQuantity   :%c ${product.split(";")[2] ? product.split(";")[2] : '[Not Set]'}\n` +
        `%cPrice      :%c ${product.split(";")[3] ? product.split(";")[3] : '[Not Set]'}\n` +
        `%cEvents     :%c ${prodEventsContainer?.events ? prodEventsContainer?.events : '[Not Set]'}\n` +
        `%cTrans. Id  :%c ${transactionId || '[Not Set]'}\n` +
        `%cMerch.Vars :%c ${product.split(";")[5] ? product.split(";")[5].split("|").join(", ") : '[Not Set]'}`,
        cssHeadField, "", cssHeadField, "", cssHeadField, "", cssHeadField, "", cssHeadField, "", cssHeadField, "", cssHeadField, ""
      );
    }
  });
  console.groupEnd(); //close the Products section
  return true;
}

function getProductEvents(prodEvents, globalEvents) {
  const result = {};
  if (prodEvents.length < 7) {
    return {
      events: prodEvents,
      wrongEvents: false
    }
  }
  const rogueEvents = prodEvents.split("|").filter(prodEvent => {
    return globalEvents.indexOf(prodEvent.split("=")[0].split(":")[0]) === -1;
  });
  if (rogueEvents.length > 0) {
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
  }).map(param => decodeURIComponent(param));
  parsingResult.alleVars = allParams.filter(param => {
    return /^v[1-9]\d?\d?=/.test(param);
  }).map(param => decodeURIComponent(param));
  parsingResult.allListVars = allParams.filter(param => {
    return /^l\d=/.test(param);
  }).map(param => decodeURIComponent(param));
  parsingResult.allHierarchy = allParams.filter(param => {
    return /^h\d=/.test(param);
  }).map(param => decodeURIComponent(param));
  parsingResult.rSuite = allParams[0].match(/b\/ss\/([^\/]+)\//)[1];
  parsingResult.events = getComponent(allParams, "events");
  parsingResult.campaign = getComponent(allParams, "v0");
  parsingResult.pageName = getComponent(allParams, "pageName");
  parsingResult.zip = getComponent(allParams, "zip");
  parsingResult.pageType = getComponent(allParams, "pageType");
  parsingResult.server = getComponent(allParams, "server");
  parsingResult.url = getComponent(allParams, "g");
  parsingResult.url2 = getComponent(allParams, "-g");
  parsingResult.currencyCode = getComponent(allParams, "cc");
  parsingResult.mcorgid = getComponent(allParams, "mcorgid");
  parsingResult.mid = getComponent(allParams, "mid");
  parsingResult.products = getComponent(allParams, "products");
  parsingResult.visitorId = getComponent(allParams, "aid");
  parsingResult.customLinkType = getComponent(allParams, "pe");
  parsingResult.customLinkUrl = getComponent(allParams, "pev1");
  parsingResult.customLinkName = getComponent(allParams, "pev2");
  parsingResult.siteSection = getComponent(allParams, "ch");
  parsingResult.transactionId = getComponent(allParams, "xact");
  return parsingResult;
}

function getContextVars(fullURL) {
  if (fullURL.indexOf("&c.&") > 0 && fullURL.indexOf("&.c&") > 0) {
    try {
      return fullURL.split("&c.&")[1].split("&.c&")[0].split("&").map(contextVar => decodeURIComponent(contextVar));
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
  return decodeURIComponent(foundElement?.split(/=(.+)?/, 2)[1]);
}

function logWebSDKServerCall(postPayload, settings = {}, networkError, baseURL) {
  const websdkBackgroundColor = settings?.colors?.["websdk-bg"] || "#008B8B";
  const websdkTextColor = settings?.colors?.["websdk-txt"] || "#FFFF00";
  const errorBackgroundColor = settings?.colors?.["error-bg"] || "#FF0000";
  const errorTextColor = settings?.colors?.["error-txt"] || "#000000";
  //console.log("@@@ Debugging: webSDK Detected! The post payload object is: ", postPayload);
  let edgeConfigId = "[Not Found]";
  try {
    edgeConfigId = baseURL.split("configId=")[1]?.split(/\&|$/)[0]?.slice(0, 8);
  } catch (e) {
    edgeConfigId = e;
  }
  postPayload.events.forEach((WSEvent) => {
    document.wSDKCounter = document.wSDKCounter ? document.wSDKCounter + 1 : 1;
    let cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 500;font-size: 1.2em; background-color: ${websdkBackgroundColor}; color: ${websdkTextColor}`;
    let cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; background-color: ${websdkBackgroundColor}; color: ${websdkTextColor}`;
    const scType = WSEvent.xdm?.web?.webPageDetails?.name || WSEvent.xdm?.web?.webPageDetails?.URL ? "Page View" : "Link";
    let sCallName = "[No Name]";
    if (scType === "Page View") {
      sCallName = WSEvent.xdm?.web?.webPageDetails?.name || "[No Name]";
    } else if (scType === "Link") {
      sCallName = WSEvent.xdm?.web?.webInteraction?.name || "[No Name]";
    }
    if (networkError) {
      cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 500;font-size: 1.2em; ${errorBackgroundColor}; color: ${errorTextColor}`;
      cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; ${errorBackgroundColor}; color: ${errorTextColor}`;
    }
    const pNameMessage = scType + ": %c" + sCallName;
    const mainLogHeader = `${networkError ? "%cERROR: " + networkError + "\n" : "%c"}` +
      `Web SDK #${document.wSDKCounter}: ${pNameMessage}\n%c` +
      `Event Type: %c${WSEvent.xdm?.eventType || "[none]"}%c, ` +
      `Edge ID: %c${edgeConfigId}\n`;
    if (settings?.mainExpand === true) {
      console.group(mainLogHeader,
        cssHeadField, cssHeadValue, cssHeadField, cssHeadValue, cssHeadField, cssHeadValue);
    } else {
      console.groupCollapsed(mainLogHeader,
        cssHeadField, cssHeadValue, cssHeadField, cssHeadValue, cssHeadField, cssHeadValue);
    }
    const fieldsToExclude = settings?.logBoringFieldsWebSDK === true ? [] : ["device", "environment", "placeContext", "implementationDetails", "timestamp"];
    try {
      const cssInnerStyle = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 700;font-size: 1.2em; background-color: Yellow; color: black`;
      const cssHeadValue = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 900;font-size: 1.2em; background-color: Orange; color: black`;
      if (!settings.logAllWebSDK) {
        Object.keys(WSEvent?.xdm || {}).forEach((field) => {
          let fieldObject = WSEvent.xdm[field];
          if (fieldsToExclude.includes(field)) {
            return;
          } else if (typeof fieldObject !== "object") {
            console.log(`%cxdm.${field} = %c${fieldObject}`, cssInnerStyle, cssHeadValue);
          } else if (field === "_experience" && fieldObject?.analytics && Object.keys(fieldObject).length === 1) {
            console.log(`%cxdm._experience.analytics:`, cssInnerStyle, fieldObject.analytics);
          } else {
            console.log(`%cxdm.${field}:`, cssInnerStyle, fieldObject);
          }
        });
      } else {
        Object.keys(WSEvent || {}).forEach((field) => {
          let fieldObject = WSEvent[field];
          if (typeof fieldObject !== "object") {
            console.log(`%c${field} = %c${fieldObject}`, cssInnerStyle, cssHeadValue);
          } else {
            console.log(`%c${field}:`, cssInnerStyle, fieldObject);
          }
        });
      }
      if (settings.logDataObject && !settings.logAllWebSDK) {
        Object.keys(WSEvent?.data?.__adobe || {}).forEach((field) => {
          let fieldObject = WSEvent.data.__adobe[field];
          console.log(`%cdata.__adobe.${field}:`, cssInnerStyle, fieldObject);
        });
      }
    } catch (e) {
      console.error(e);
    }
    console.groupEnd();
    logCustomXDMFields(settings.loggingHeadings, WSEvent.xdm, document.wSDKCounter, networkError, WSEvent.data?.__adobe?.analytics)
  });
}

function logCustomXDMFields(loggingHeadings, xdm, counter, networkError, dataAnalytics = {}) {
  if (loggingHeadings?.length > 0) {
    const cssHeadField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 600;font-size: 1.2em;` +
      ` background-color: ${networkError ? "Red" : "Orange"}; color: black`;
    const cssValueField = `border-bottom: 1px solid grey;font-family: 'Courier New', monospace;font-weight: 400;font-size: 1.2em;` +
      ` background-color: ${networkError ? "Red" : "Orange"}; color: black`;
    console.group(`%c Web SDK #${counter}${networkError ? " (ERROR)" : ""} User-customized additional logging:`, cssValueField);
    loggingHeadings.forEach(heading => {
      let shortCutValue = "";
      if (/^evar\d/i.test(heading) || /^v\d/i.test(heading)) {
        heading = heading.replace(/^(v)(\d+)/i, "eVar$2");
        shortCutValue = dataAnalytics[heading?.replace(/evar/i, "eVar")];
        if (shortCutValue !== undefined) {
          heading = `data.__adobe.analytics.${heading}`;
        } else {
          heading = "_experience.analytics.customDimensions.eVars." + heading.replace(/evar/i, "eVar");
        }
      } else if (/^(event)|e\d/i.test(heading.toLowerCase())) {
        heading = heading.replace(/^(e)(\d+)/i, "event$2");
        const eventNumber = Number?.parseInt(heading.split("event")?.slice(-1));
        if (eventNumber) {
          if (dataAnalytics?.events?.toLowerCase()?.includes(heading?.toLowerCase())) {
            shortCutValue = dataAnalytics.events.split(heading?.toLowerCase() + "=")[1]?.split(/,|$/)[0] || 1;
            heading = `data.__adobe.analytics.events.${heading}`;
          } else {
            if (eventNumber) {
              heading += ".value";
              if (eventNumber < 101) {
                heading = "_experience.analytics.event1to100." + heading;
              } else if (eventNumber < 201) {
                heading = "_experience.analytics.event101to200." + heading;
              } else if (eventNumber < 301) {
                heading = "_experience.analytics.event201to300." + heading;
              } else if (eventNumber < 401) {
                heading = "_experience.analytics.event301to400." + heading;
              } else if (eventNumber < 501) {
                heading = "_experience.analytics.event401to500." + heading;
              } else if (eventNumber < 601) {
                heading = "_experience.analytics.event501to600." + heading;
              } else if (eventNumber < 701) {
                heading = "_experience.analytics.event601to700." + heading;
              } else if (eventNumber < 801) {
                heading = "_experience.analytics.event701to800." + heading;
              } else if (eventNumber < 901) {
                heading = "_experience.analytics.event801to900." + heading;
              } else if (eventNumber < 1000) {
                heading = "_experience.analytics.event901to1000." + heading;
              }
            }
          }
        }
      } else if (/^(prop|p|c)\d/i.test(heading)) {
        heading = heading.replace(/^(p|c)(\d+)/i, "prop$2");
        if (dataAnalytics[heading.toLowerCase()] !== undefined) {
          shortCutValue = dataAnalytics[heading.toLowerCase()];
          heading = `data.__adobe.analytics.${heading}`;
        } else {
          heading = "_experience.analytics.customDimensions.props." + heading.toLowerCase();
        }
      } else if (/^(listvar\d|list\d|l\d$|lvar\d$)/i.test(heading)) {
        const listNumber = parseInt(heading.slice(-1));
        if (listNumber) {
          if (dataAnalytics["list" + listNumber]) {
            heading = `data.__adobe.analytics.list${listNumber}`;
            shortCutValue = dataAnalytics['list' + listNumber];
          } else {
            heading = `_experience.analytics.customDimensions.lists.list${listNumber}.list`;
          }
        }
      }
      if (shortCutValue || /^data\.__adobe/.test(heading)) {
        console.log(`%c${heading} :%o`, cssHeadField, shortCutValue);
      } else {
        const XDMValueResult = GetXDMValue(xdm, heading.split("."));
        if (XDMValueResult.status === 'ok') {
          console.log(`%c${heading} :%o`, cssHeadField, XDMValueResult.fieldValue);
        } else if (XDMValueResult.status === 'path remaining') {
          console.log(`%c${heading}%c requested, but %c${XDMValueResult.path[0]}%c is not an object. Its value is :%o`,
            cssHeadField, cssValueField, cssHeadField, cssValueField, XDMValueResult.fieldValue);
        } else if (XDMValueResult.status === 'undefined') {
          console.log(`%c${heading}%c requested, but ` +
            `%c${XDMValueResult.propertyName === heading ? "it" : XDMValueResult.propertyName}%c is undefined`,
            cssHeadField, cssValueField, cssHeadField, cssValueField);
        }
      }
    });
    console.groupEnd();
  }
}

function GetXDMValue(xdm, path) {
  //Recursion! How often can you justify it? heh!
  if (typeof xdm[path[0]] === "object" && path.length > 1) {
    return GetXDMValue(xdm[path[0]], path.slice(1));
  } else {
    if (typeof xdm[path[0]] === "undefined") {
      return {
        propertyName: path[0],
        status: 'undefined'
      };
    } else {
      if (path.length === 1) {
        return {
          fieldValue: xdm[path[0]],
          status: 'ok'
        };
      } else {
        return {
          fieldValue: xdm[path[0]],
          status: 'path remaining',
          path: path
        };
      }
    }
  }
}
