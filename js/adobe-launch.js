addEventListener("load", _ => {
  chrome.storage.sync.get('settings', function (data) {
    if (data?.settings?.enableLaunchUIImprovements && /experience\.adobe\.com/i.test(location?.ancestorOrigins[0])) {
      window.setInterval(_ => main(data.settings), 250);
    }
  });
});

function main(UADSettingsObject = {}){
  const librarySelector = document.querySelector("div.librarySelect");
  if (!librarySelector) return false;
  libraryCheck(librarySelector);
}

function libraryCheck(librarySelector){
  if(librarySelector.innerText === "Select a working library"){
    librarySelector.querySelector("span").classList.add("UAD-lib-error");
  } else {
    librarySelector.querySelector("span").classList.remove("UAD-lib-error");
  }
}