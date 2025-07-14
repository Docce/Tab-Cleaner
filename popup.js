const whitelistUl = document.getElementById("whitelist");
const urlInput = document.getElementById("urlInput");
const addBtn = document.getElementById("addBtn");
const cleanBtn = document.getElementById("cleanBtn");
const intervalInput = document.getElementById("intervalInput");
const setIntervalBtn = document.getElementById("setIntervalBtn");

function renderWhitelist(whitelist) {
  whitelistUl.innerHTML = "";
  whitelist.forEach((url, index) => {
    const li = document.createElement("li");
    li.textContent = url;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "X";
    removeBtn.style.marginLeft = "5px";
    removeBtn.style.width = "50px"
    removeBtn.onclick = () => removeFromWhitelist(index);

    li.appendChild(removeBtn);
    whitelistUl.appendChild(li);
  });
}

function loadSettings() {
  chrome.storage.sync.get({ whitelist: [], interval: 30 }, ({ whitelist, interval }) => {
    renderWhitelist(whitelist);
    intervalInput.value = interval;
  });
}

function addToWhitelist() {
  const newUrl = urlInput.value.trim();
  if (!newUrl) return;

  chrome.storage.sync.get({ whitelist: [] }, ({ whitelist }) => {
    if (!whitelist.includes(newUrl)) {
      whitelist.push(newUrl);
      chrome.storage.sync.set({ whitelist }, () => {
        urlInput.value = "";
        loadSettings();
      });
    }
  });
}

function removeFromWhitelist(index) {
  chrome.storage.sync.get({ whitelist: [] }, ({ whitelist }) => {
    whitelist.splice(index, 1);
    chrome.storage.sync.set({ whitelist }, loadSettings);
  });
}

function setIntervalTime() {
  const interval = parseInt(intervalInput.value, 10);
  if (interval >= 5) {
    chrome.storage.sync.set({ interval });
    chrome.runtime.sendMessage({ setInterval: interval });
  } else {
    alert("Interval must be 5 seconds or more.");
  }
}

addBtn.onclick = addToWhitelist;
cleanBtn.onclick = () => chrome.runtime.sendMessage("cleanTabs");
setIntervalBtn.onclick = setIntervalTime;

document.addEventListener("DOMContentLoaded", loadSettings);