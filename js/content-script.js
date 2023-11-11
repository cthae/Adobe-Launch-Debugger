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