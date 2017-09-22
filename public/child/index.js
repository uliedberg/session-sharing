"use strict";

const uuid = uuidv4();

window.addEventListener("message", function(event) {
  console.log('child index.js received message: ', event);
  domLogIncomingMessage(event.data)
  if (event && event.data && event.data.cmd == 'fetch_cookie') {
    fetchCookie(uuid, function (json) {
      handleCookieCallResult('yellow', json);
    });
  }
});

document.addEventListener("DOMContentLoaded", function(event) {
  window.parent.postMessage({ height: document.body.scrollHeight }, "*");
  fetchCookie(uuid, handleCookieCallResult.bind(this, 'green'));
    // .then(function () { window.parent.postMessage({ height: document.body.scrollHeight }, "*"); });
  document.querySelector('#api-call').addEventListener('click', function (e) {
    e.preventDefault();
    fetchCookie(uuid, handleCookieCallResult.bind(this, 'green'));
  });
});

document.querySelector('#link-new-context').addEventListener('click', function (e) {
  e.preventDefault();
  const newWin = window.open(e.target.href);
  // Note that the listeners abide to same-origin-policy - otherwise won't be triggered
  newWin.addEventListener('load', function(loadEvent) {
    newWin.addEventListener('unload', function (unloadEvent) {
      console.log(`${e.target.href} unloaded - fetching cookie (not fetching cookue for now... using postmessage)`);
      // fetchCookie(uuid, handleCookieCallResult.bind(this, 'yellow'));
    });
    const bouncerMessage = { msg: "ping ping bouncer" };
    console.log('child index.js will post: ', bouncerMessage);
    domLogOutgoingMessage(bouncerMessage);
    newWin.postMessage(bouncerMessage, '*');
  });
  // Note: you can do both on unload and on focus and debounce
  // addEventListenerRunOnce(window, 'focus', function (e) {
  //   console.log('child window focus after new context has been opened - fetching cookie', e);
  //   fetchCookie(uuid, handleCookieCallResult.bind(this, 'magenta'));
  // });
});

// include credentials for cookies - try good old XHR instead?
function fetchCookie (uuid, jsonResFunc) {
  return fetch(`/api/cookie/${uuid}`, { method: 'get', credentials: 'include', headers: { 'Accept': 'application/json' } })
    .then(function (response) {
      if(response.ok) { return response.json(); }
      throw new Error('Network response was not ok.');
    })
    .then(function (json) { jsonResFunc(json); })
    .catch(function (error) { console.log({message: 'error calling API', error: error }); });
}

function handleCookieCallResult(cssClass, json) {
  updateApiResult(cssClass, json);
  toggleUserInteractionLinks(json.value);
}

function updateApiResult (cssClass, json) {
  const result = document.querySelector('#api-result');
  result.innerHTML = `${json.name} => ${json.value}`;
  result.classList.add('updated', cssClass);
  setTimeout(function () { result.classList.remove('updated', cssClass); }, 200);
}

function toggleUserInteractionLinks(value) {
  const element = document.querySelector('#user-interaction-links');
  element.classList[value != undefined ? 'add' : 'remove']('hidden');
}

function uuidv4 () {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

function addEventListenerRunOnce(elem, type, func) {
  const wrapper = function (e) {
    elem.removeEventListener(type, wrapper);
    func(e);
  }
  elem.addEventListener(type, wrapper);
}

function domLogOutgoingMessage(data) {
  domLog(`> ${JSON.stringify(data)}`);
}

function domLogIncomingMessage(data) {
  domLog(`< ${JSON.stringify(data)}`);
}

function domLogJson(json) {
  domLog(JSON.stringify(json));
}

function domLog(message) {
  const messages = document.querySelector('#messages');
  appendParagraph(messages, message);
}

function appendParagraph(el, text) {
  const p = document.createElement('p');
  p.textContent = text;
  el.appendChild(p);
}
