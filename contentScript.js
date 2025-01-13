// contentScript.js

// A small helper to parse the bucket + object from the URL
function getGsUriFromUrl() {
    // Example URL:
    // https://console.cloud.google.com/storage/browser/_details/corpusant-data-us-west1/mewtwo/training/silver/mewthree-with-forced-alignment/train/shard_00000.parquet;tab=live_object

    const url = window.location.href;

    // Sanity check: only proceed if ".parquet" is indeed in the URL
    if (!url.includes(".parquet")) return null;

    // Everything after "_details/" is basically "bucketName/any/folders/file.parquet;tab=..."
    const parts = url.split("/_details/")[1].split(";")[0].split("/");
    // parts[0] = bucketName
    // parts[1..n-1] = path segments
    // last part typically includes .parquet

    const bucketName = parts[0];
    // everything after the first element is the object path
    const objectPath = parts.slice(1).join("/");

    // Construct the full gs:// path
    return `gs://${bucketName}/${objectPath}`;
  }

  // A function to inject a button into the page
  function injectPreviewButton(gsUri) {
    // Create a container for the button + preview output
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "100px";  // adjust as needed
    container.style.right = "20px";
    container.style.zIndex = 9999;
    container.style.padding = "8px";
    container.style.backgroundColor = "#f9f9f9";
    container.style.border = "1px solid #ccc";
    container.style.borderRadius = "4px";

    // Create a button
    const button = document.createElement("button");
    button.textContent = "Preview Parquet";
    button.style.cursor = "pointer";

    // Create an area (div) to display results
    const resultDiv = document.createElement("div");
    resultDiv.style.marginTop = "8px";
    resultDiv.style.maxHeight = "300px";
    resultDiv.style.overflow = "auto";
    resultDiv.style.fontSize = "12px";
    resultDiv.style.fontFamily = "monospace";

    // On button click, fetch a preview from your FastAPI server
    button.addEventListener("click", async () => {
      resultDiv.textContent = "Loading preview...";
      try {
        const response = await fetch("http://allen-dev:8052/read_parquet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_path: gsUri }),
        });
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        const data = await response.json();
        // data has the shape { dataframe: {...}, columns: [...] }
        // Display it in the resultDiv
        resultDiv.textContent = data.html
      } catch (err) {
        resultDiv.textContent = "Error: " + err.toString();
      }
    });

    // Add everything to the container
    container.appendChild(button);
    container.appendChild(resultDiv);

    // Finally, add the container to the page
    document.body.appendChild(container);
  }

  // The logic that runs on page load
  (function main() {
    // Possibly wait for the page to finish dynamic loads
    // but GCS console is mostly client-side, so we can do a small timeout:
    setTimeout(() => {
      const gsUri = getGsUriFromUrl();
      if (gsUri) {
        injectPreviewButton(gsUri);
      }
    }, 2000);
  })();