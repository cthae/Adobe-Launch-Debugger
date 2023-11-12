console.log("@@@ Debugging content-script.js");

chrome.runtime.onMessage.addListener(info => {
  chrome.storage.sync.get('aabox', function (data) {
    console.log("@@@ CS: aabox: ", data?.aabox);
    if(data?.aabox !== false){
      console.log("@@@ Debugging CS listener 2:", info);
    }
  });
});

chrome.storage.sync.get('launchbox', async function (data) {
  console.log("@@@ CS: launchbox: ", data?.launchbox);
  if (data?.launchbox !== false) {
    talkToBG({type: 'setDebug', value:1});
  } else {
    talkToBG({type: 'setDebug', value:0});
  }
}); 

function talkToBG(message){
  console.log("@@@ CS: talkToBG: ", message);
  chrome.runtime.sendMessage(message);
}

function parseServerCall(fullURL){
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
  parsingResult.events = allParams.find(param => /^events=/.test(param)).split("=")[1];
  parsingResult.campaign = allParams.find(param => /^v0=/.test(param)).split("=")[1];
  parsingResult.rsuite = allParams[0].match(/b\/ss\/([^\/]+)\//)[1];
  parsingResult.pageName = allParams.find(param => /^pageName=/.test(param)).split("=")[1];
  parsingResult.pageType = allParams.find(param => /^pageType=/.test(param)).split("=")[1];
  parsingResult.server = allParams.find(param => /^server=/.test(param)).split("=")[1];
  parsingResult.url = allParams.find(param => /^g=/.test(param)).split("=")[1];
  parsingResult.url2 = allParams.find(param => /^-g=/.test(param)).split("=")[1];
  parsingResult.currencyCode = allParams.find(param => /^cc=/.test(param)).split("=")[1];
  parsingResult.products = allParams.find(param => /^products=/.test(param)).split("=")[1];
  parsingResult.visitorId = allParams.find(param => /^aid=/.test(param)).split("=")[1];
  return parsingResult;
}