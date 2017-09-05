"use strict";

const uuid = uuidv4();

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
      console.log(`${e.target.href} unloaded - fetching cookie`);
      fetchCookie(uuid, handleCookieCallResult.bind(this, 'yellow'));
    });
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
