/**
 * OpenShop Landing Page - EULA / Legal Terms Gatekeeper
 * Evaluates agreement status from localStorage & cookies immediately to prevent layout shifts.
 */

(function () {
  'use strict';

  // Immediate class toggle to avoid flash of unstyled/unverified content
  try {
    const accepted = localStorage.getItem('openshop_eula_accepted') === '1' ||
                     document.cookie.indexOf('openshop_eula_accepted=1') !== -1;
    if (!accepted) {
      document.documentElement.classList.add('eula-pending');
    } else {
      document.documentElement.classList.add('eula-accepted');
    }
  } catch (e) {
    document.documentElement.classList.add('eula-accepted');
  }

  function hasAcceptedEula() {
    try {
      return localStorage.getItem('openshop_eula_accepted') === '1' ||
             document.cookie.indexOf('openshop_eula_accepted=1') !== -1;
    } catch (e) {
      return document.cookie.indexOf('openshop_eula_accepted=1') !== -1;
    }
  }

  function setEulaCookie(name, val, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${val}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
  }

  function acceptEula() {
    try {
      localStorage.setItem('openshop_eula_accepted', '1');
    } catch (e) {}
    setEulaCookie('openshop_eula_accepted', '1');
  }

  function initEula(onAccepted) {
    const eulaOverlay = document.getElementById('eulaOverlay');
    const eulaCheckbox = document.getElementById('eulaCheckbox');
    const btnAcceptEula = document.getElementById('btnAcceptEula');

    if (eulaCheckbox && btnAcceptEula) {
      eulaCheckbox.addEventListener('change', () => {
        btnAcceptEula.disabled = !eulaCheckbox.checked;
      });

      btnAcceptEula.addEventListener('click', () => {
        acceptEula();
        if (eulaOverlay) {
          eulaOverlay.classList.add('closing');
        }
        setTimeout(() => {
          document.documentElement.classList.remove('eula-pending');
          document.documentElement.classList.add('eula-accepted');
          if (typeof onAccepted === 'function') {
            setTimeout(onAccepted, 300);
          }
        }, 350);
      });
    }

    if (hasAcceptedEula()) {
      document.documentElement.classList.add('eula-accepted');
      if (typeof onAccepted === 'function') {
        setTimeout(onAccepted, 200);
      }
    }
  }

  // Expose to window for demo controller
  window.OpenShopEula = {
    hasAccepted: hasAcceptedEula,
    accept: acceptEula,
    init: initEula
  };
})();
