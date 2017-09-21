"use strict";

delayWithStatus(window.close);

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

function delayWithStatus (fun) {
  const delayTime = 0; //5000; // bug in webkit - solved in https://bugs.webkit.org/show_bug.cgi?id=175090 - has not landed in Safari
  const status = document.querySelector('#status');
  status.innerHTML = `delaying action for ${delayTime}ms`
  status.classList.add('updated', 'green');
  setTimeout(function () { status.classList.remove('updated', 'green'); }, 300);
  setTimeout(function () { status.innerHTML = ''; fun(); }, delayTime);
}
