chrome.omnibox.onInputEntered.addListener((text) => {
  if (text.startsWith('gs://')) {
    text = text.substring(5); // Remove 'gs://'
  }
  const url = 'https://console.cloud.google.com/storage/browser/' + text;
  chrome.tabs.update({ url: url });
});
