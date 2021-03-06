"use strict";

const cfg = window.iframeConfig;
const iframe = document.createElement('iframe');
iframe.src = cfg.src;
document
  .querySelector(`#${cfg.parent_id}`)
  .appendChild(iframe);

window.addEventListener("message", function(event) {
  if (event.data.height == undefined) { return; }
  iframe.style.height = `${event.data.height}px`;
});
