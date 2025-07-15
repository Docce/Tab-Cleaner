chrome.runtime.onStartup.addListener(() => {
  setIntervalTime()
  loadWhitelistFromIni();
  
});

chrome.runtime.onInstalled.addListener(() => {
  loadWhitelistFromIni();
});

function loadWhitelistFromIni() {
  fetch(chrome.runtime.getURL("whitelist.ini"))
    .then(response => response.text())
    .then(content => {
      const whitelist = parseIni(content);
      chrome.storage.sync.set({ whitelist }, () => {
        console.log("Whitelist loaded from INI:", whitelist);
      });
    })
    .catch(err => {
      console.error("Failed to load whitelist.ini:", err);
    });
}

function isWhitelisted(url, whitelist) {
  return whitelist.some(allowed => url.startsWith(allowed));
}

function checkAndCleanTabs() {
  chrome.storage.sync.get({ whitelist: [] }, ({ whitelist }) => {
    chrome.tabs.query({}, (tabs) => {
      for (let tab of tabs) {
        if (!isWhitelisted(tab.url, whitelist) && !tab.pinned) {
          chrome.tabs.remove(tab.id);
        }
      }
    });
  });
}

function cycleWhitelistedTab() {
  chrome.storage.sync.get({ whitelist: [] }, ({ whitelist }) => {
    chrome.tabs.query({}, (tabs) => {
      const whitelistedTabs = tabs.filter(tab => isWhitelisted(tab.url, whitelist));
      if (whitelistedTabs.length > 0) {
        chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
          const activeTab = activeTabs[0];
          const currentIndex = whitelistedTabs.findIndex(t => t.id === activeTab?.id);
          const nextTab = whitelistedTabs[(currentIndex + 1) % whitelistedTabs.length];

          if (nextTab) {
            chrome.tabs.update(nextTab.id, { active: true }, () => {
              chrome.tabs.reload(nextTab.id); // 🔄 Always refresh after activating
            });
          }
        });
      }
    });
  });
}


// Combined periodic task
function handlePeriodicTask() {
  checkAndCleanTabs();
  cycleWhitelistedTab();
}

// Alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "tabCleanerAlarm") {
    handlePeriodicTask();
  }
});

function parseIni(content) {
  const lines = content.split('\n');
  const urls = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("url")) {
      const parts = trimmed.split('=');
      if (parts.length === 2) {
        urls.push(parts[1].trim());
      }
    }
  }

  return urls;
}

// Listen for interval change or button click
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "cleanTabs") {
    handlePeriodicTask();
  } else if (message.setInterval) {
    chrome.alarms.clear("tabCleanerAlarm", () => {
      chrome.alarms.create("tabCleanerAlarm", {
        periodInMinutes: message.setInterval / 60  // seconds → minutes
      });
    });
  }
});