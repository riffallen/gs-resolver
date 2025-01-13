document.addEventListener("DOMContentLoaded", () => {
    const backendUrlInput = document.getElementById("backend-url");
    const saveButton = document.getElementById("save-btn");

    // Load current URL from Chrome storage
    chrome.storage.sync.get("backendUrl", (data) => {
      if (data.backendUrl) {
        backendUrlInput.value = data.backendUrl;
      }
    });

    // Save new URL to Chrome storage
    saveButton.addEventListener("click", () => {
      const newUrl = backendUrlInput.value.trim();
      chrome.storage.sync.set({ backendUrl: newUrl }, () => {
        alert("Backend URL saved!");
      });
    });
  });