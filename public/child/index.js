"use strict";

const uuid = uuidv4();

document.addEventListener("DOMContentLoaded", function(event) {
  window.parent.postMessage({ height: document.body.scrollHeight }, "*");
  updateClientCookie('green');
  hasStorageAccessUpdate('.has-storage-access-on-load', 'green');
  if (document.requestStorageAccess) {
    console.log('document.requestStorageAccess exists! :)');
    document.querySelector('#request-storage-access').addEventListener('click', function(e) {
      e.preventDefault();
      document.requestStorageAccess()
        .then(
          function resolved() {
            // we now have access!
            console.log('requestStorageAccess resolved! :)');
            updateClientCookie('yellow'); // or simply put it in hasStorageAccess?
            // hasStorageAccessUpdate('.has-storage-access-after-req', 'yellow');
            updateHasStorageAccessResult(true, '.has-storage-access-after-req', 'yellow');
            // check a non httpOnly cookie to see if we still have cookies or if they are purged
            fetchCookie(uuid, handleCookieCallResult.bind(this, 'magenta'));
          },
          function rejected(reason) {
            // we don't have access for reason? // call hasStorageAccess to find out?
            updateClientCookie('yellow'); // or simply put it in hasStorageAccess?
            console.log('requestStorageAccess rejected! :(');
            // hasStorageAccessUpdate('.has-storage-access-after-req', 'yellow');
            updateHasStorageAccessResult(`promise rejected: ${reason}`, '.has-storage-access-after-req', 'yellow');
          }
        );
    });
  }
  fetchCookie(uuid, handleCookieCallResult.bind(this, 'green'));
    // .then(function () { window.parent.postMessage({ height: document.body.scrollHeight }, "*"); });
  document.querySelector('#api-call').addEventListener('click', function (e) {
    e.preventDefault();
    fetchCookie(uuid, handleCookieCallResult.bind(this, 'green'));
  });
});

// TODO: merde this is ugly
// location.reload(); // arg true means force reload from server - since it might happen regardless we need to fix redirect_url...
document.querySelector('#link-reload-iframe').addEventListener('click', function (e) {
  e.preventDefault();
  console.log('about to reload iframe - current location: ', location)
  const params = new URLSearchParams(document.location.search.substring(1));
  if (!params.get('return-url')) {
    const newUrl = location.href + (!!location.search ? '&' : '?') + 'return-url=' + document.referrer;
    console.log('about to reload iframe - location with added query param return-url with document.referrer: ', newUrl)
    location.assign(newUrl)
  } else {
    location.reload();
  }
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

function updateClientCookie(cssClass) {
  const result = document.querySelector('.client-cookie');
  result.innerHTML = !!readJsCookie();
  result.classList.add('updated', cssClass);
  setTimeout(function () { result.classList.remove('updated', cssClass); }, 200);
}

function hasStorageAccessUpdate(className, cssClass) {
  if (document.hasStorageAccess) {
    document.hasStorageAccess()
      .then(
        function resolved(hasAccess) {
          updateHasStorageAccessResult(hasAccess, className, cssClass);
        },
        function rejected(reason) {
          updateHasStorageAccessResult(`promise rejected: ${reason}`, className, cssClass);
        }
      );
  }
}

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

function updateHasStorageAccessResult(hasStorageAccessResult, className, cssClass) {
  const result = document.querySelector(className);
  result.innerHTML = hasStorageAccessResult;
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

// TODO: parameterize the cookie name...
function readJsCookie() {
  return document.cookie.replace(/(?:(?:^|.*;\s*)has-bounce\s*\=\s*([^;]*).*$)|^.*$/, '$1');
}

function addEventListenerRunOnce(elem, type, func) {
  const wrapper = function (e) {
    elem.removeEventListener(type, wrapper);
    func(e);
  }
  elem.addEventListener(type, wrapper);
}
