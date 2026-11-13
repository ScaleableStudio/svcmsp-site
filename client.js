'use strict';
// Progressively enhance ordinary navigation links. With no JS, the links stay visible.
const menu = document.querySelector('.menu-btn');
const nav = document.getElementById('site-nav');
const mobile = window.matchMedia('(max-width: 980px)');
const setMenu = open => {
  document.body.classList.toggle('nav-open', open);
  menu.setAttribute('aria-expanded', String(open));
};
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menu.focus();
  }
});
document.addEventListener('click', event => {
  if (!nav.contains(event.target) && !menu.contains(event.target)) setMenu(false);
});
document.querySelector('.site-head').addEventListener('focusout', event => {
  if (!event.currentTarget.contains(event.relatedTarget)) setMenu(false);
});
nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
mobile.addEventListener('change', () => setMenu(false));
document.documentElement.classList.add('js');

// The concept has no submission route. Register prevention before enabling any fields.
const form = document.getElementById('enquiry');
if (form) {
  const error = document.getElementById('f-error');
  const status = document.getElementById('f-status');
  const validate = control => {
    if (!control.willValidate) return;
    const invalid = !control.checkValidity();
    control.setAttribute('aria-invalid', String(invalid));
    const ids = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== 'f-error');
    if (invalid) ids.push('f-error');
    if (ids.length) control.setAttribute('aria-describedby', ids.join(' '));
    else control.removeAttribute('aria-describedby');
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    status.hidden = true;
    const controls = Array.from(form.elements).filter(control => control.willValidate);
    controls.forEach(validate);
    const invalid = controls.filter(control => !control.checkValidity());
    error.hidden = invalid.length === 0;
    if (invalid.length) {
      error.textContent = 'Please complete the highlighted fields and use a valid email address.';
      invalid[0].focus();
      return;
    }
    status.hidden = false;
    status.setAttribute('tabindex', '-1');
    status.focus();
  });
  form.addEventListener('input', event => {
    status.hidden = true;
    if (event.target.hasAttribute('aria-invalid')) validate(event.target);
    error.hidden = !form.querySelector('[aria-invalid="true"]');
  });
  form.querySelector('fieldset').disabled = false;
}
