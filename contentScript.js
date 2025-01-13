// contentScript.js

function getGsUriFromUrl() {
    const url = window.location.href;
    if (!url.includes(".parquet")) return null;

    // Extract after '/_details/' and before any ';tab=...'
    const afterDetails = url.split("/_details/")[1].split(";")[0];
    const parts = afterDetails.split("/");
    // parts[0] => bucketName
    // parts.slice(1).join("/") => objectPath
    const bucketName = parts[0];
    const objectPath = parts.slice(1).join("/");
    return `gs://${bucketName}/${objectPath}`;
  }

  // Create a small floating container with a "Preview" button + result area
  function injectPreviewButton(gsUri, backendUrl) {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "100px";
    container.style.right = "20px";
    container.style.zIndex = 999999;
    container.style.padding = "8px";
    container.style.backgroundColor = "#f9f9f9";
    container.style.border = "1px solid #ccc";
    container.style.borderRadius = "4px";

    const button = document.createElement("button");
    button.textContent = "Preview Parquet";
    button.style.cursor = "pointer";

    const resultDiv = document.createElement("div");
    resultDiv.style.marginTop = "8px";
    resultDiv.style.maxHeight = "400px";
    resultDiv.style.overflow = "auto";
    resultDiv.style.fontSize = "12px";
    resultDiv.style.fontFamily = "monospace";

    button.addEventListener("click", async () => {
      resultDiv.textContent = "Loading preview...";
      try {
        // Example: call /read_parquet_html to get an HTML snippet
        // Could also be /read_parquet returning JSON
        const endpoint = `${backendUrl.replace(/\/+$/, "")}/read_parquet`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_path: gsUri })
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        const data = await response.json();
        // data.html should have the HTML table
        if (data.html) {
          // If it's HTML, place it in resultDiv
          resultDiv.innerHTML = data.html;
        } else {
          // Fallback if the server returns JSON
          resultDiv.textContent = JSON.stringify(data, null, 2);
        }
      } catch (err) {
        console.error(err);
        resultDiv.textContent = "Error: " + err.toString();
      }
    });

    container.appendChild(button);
    container.appendChild(resultDiv);
    document.body.appendChild(container);
  }

  // This runs on page load
  (function main() {
    // Slight delay in case the DOM is still shifting around
    setTimeout(() => {
      const gsUri = getGsUriFromUrl();
      if (gsUri) {
        // Read backendUrl from storage
        chrome.storage.sync.get("backendUrl", (data) => {
          const backendUrl = data.backendUrl || "http://allen-dev:8000";
          injectPreviewButton(gsUri, backendUrl);
        });
      }
    }, 2000);
  })();
