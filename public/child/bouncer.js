"use strict";

const uuid = uuidv4(); // cookie end point to not be cached... no real reason now...
const parsedLocation = new URL(window.location.href);
const sessionUrl = decodeURIComponent(parsedLocation.searchParams.get("session-url")); // same origin policy - or cors...

// newwin.postMessage({ msg: "heyhey popup!"}, '*');

// window.parent.postMessage({ height: document.body.scrollHeight }, "*");

window.addEventListener("message", function(event) {
  console.log('bouncer.js received message: ', event);
  domLogIncomingMessage(event.data);

  // TODO: update session & post message for iframe to fetch session once updated

  if (!!window.opener) {
    const indexMessage = { msg: 'pong pong index' };
    domLogOutgoingMessage(indexMessage);
    window.opener.postMessage(indexMessage, '*');
    fetchCookie(uuid, function (json) {
      domLogJson(json);
      if (!!json.value) {
        const cookieAvailableMsg = { cmd: 'fetch_cookie', msg: 'we have cookies!', cookie: json };
        console.log('we have a cookie value! - postmessage back to child index', json);
        domLogOutgoingMessage(cookieAvailableMsg);
        window.opener.postMessage(cookieAvailableMsg, '*');

        updateSession(sessionUrl, { data: { cookie: json } })
          .then(function (jsonRes) { // TODO: this will be run even on error...
            const fetchSessionMsg = { cmd: 'fetch_session', msg: 'cookie avaiable' };
            domLogOutgoingMessage(fetchSessionMsg);
            window.opener.postMessage(fetchSessionMsg, '*');
          });
        // TODO: OK the session handling should not go here...
      } else {
        console.log('we don\'t have cookie :/');
      }
    });
  } else {
    console.log("I'm all by myself :)");
  }
});

document.querySelectorAll('.parent-link').forEach(function (elem) {
  elem.addEventListener('click', function (e) {
    e.preventDefault();
    delayWithStatus(function () { window.location = e.target.href; });
  });
});
document.querySelectorAll('#close').forEach(function (elem) {
  elem.addEventListener('click', function (e) {
    e.preventDefault();
    delayWithStatus(window.close);
  });
});

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

function delayWithStatus (fun) {
  const delayTime = 0; //5000; // bug in webkit - solved in https://bugs.webkit.org/show_bug.cgi?id=175090 - has not landed in Safari
  const status = document.querySelector('#status');
  status.textContent = `delaying action for ${delayTime}ms`
  status.classList.add('updated', 'green');
  setTimeout(function () { status.classList.remove('updated', 'green'); }, 300);
  setTimeout(function () { status.innerHTML = ''; fun(); }, delayTime);
}

function fetchCookie (uuid, jsonResFunc) {
  return fetch(`/api/cookie/${uuid}`, { method: 'get', credentials: 'include', headers: { 'Accept': 'application/json' } })
    .then(function (response) {
      if(response.ok) { return response.json(); }
      throw new Error('Network response was not ok.');
    })
    .then(function (json) { jsonResFunc(json); })
    .catch(function (error) { console.log({message: 'error calling API', error: error }); });
}

function updateSession (url, data) {
  return fetch(url, { method: 'post', body: JSON.stringify(data), credentials: 'include', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } })
    .then(function (response) {
      if(response.ok) { return response.json(); }
      throw new Error('Network response was not ok.');
    })
    .catch(function (error) { console.log({message: 'error calling API', error: error }); });
}

function uuidv4 () {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
