/**
 * OpenShop Landing Page - Interactive P2P Flow Simulator
 * Coordinates the dual-device (Owner vs Buyer) live interactive showcase.
 */

(function () {
  'use strict';

  // Wait for DOM to be ready
  function initDemo() {
    // Containers & Viewports
    const ownerViewport = document.getElementById('ownerViewport');
    const buyerViewport = document.getElementById('buyerViewport');
    const ownerCursor = document.getElementById('ownerCursor');
    const buyerCursor = document.getElementById('buyerCursor');

    // Panels
    const ownerV1 = document.getElementById('ownerV1');
    const ownerV2 = document.getElementById('ownerV2');
    const ownerV3 = document.getElementById('ownerV3');
    const ownerV4 = document.getElementById('ownerV4');
    const ownerV5 = document.getElementById('ownerV5');
    const ownerV6 = document.getElementById('ownerV6');
    const ownerV7 = document.getElementById('ownerV7');
    const ownerQrModal = document.getElementById('ownerQrModal');

    const buyerV1 = document.getElementById('buyerV1');
    const buyerV2 = document.getElementById('buyerV2');
    const buyerV3 = document.getElementById('buyerV3');
    const buyerV4 = document.getElementById('buyerV4');
    const buyerV5 = document.getElementById('buyerV5');
    const buyerV6 = document.getElementById('buyerV6');

    const orderStatusBadge = document.getElementById('orderStatusBadge');
    const orderStatusBadgeText = document.getElementById('orderStatusBadgeText');
    const buyerTxStatusNotice = document.getElementById('buyerTxStatusNotice');
    const buyerTxStatusText = document.getElementById('buyerTxStatusText');
    const buyerTxidBox = document.getElementById('buyerTxidBox');
    const onionProgressPercent = document.getElementById('onionProgressPercent');

    // Dynamic pixel-perfect target positioning
    function moveCursorToEl(cursorEl, viewportEl, target, duration = 450, alignX = 0.5, alignY = 0.5) {
      return new Promise(resolve => {
        const el = typeof target === 'string' ? document.getElementById(target) : target;
        if (!el || !viewportEl) {
          resolve();
          return;
        }
        const vpRect = viewportEl.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        const x = (elRect.left + elRect.width * alignX) - vpRect.left;
        const y = (elRect.top + elRect.height * alignY) - vpRect.top;

        cursorEl.style.opacity = '1';
        cursorEl.style.left = `${Math.round(x)}px`;
        cursorEl.style.top = `${Math.round(y)}px`;
        setTimeout(resolve, duration);
      });
    }

    function tapCursor(cursorEl) {
      return new Promise(resolve => {
        cursorEl.classList.add('clicking');
        setTimeout(() => {
          cursorEl.classList.remove('clicking');
          setTimeout(resolve, 150);
        }, 150);
      });
    }

    function hideCursor(cursorEl) {
      cursorEl.style.opacity = '0';
    }

    function switchOwnerView(viewEl) {
      [ownerV1, ownerV2, ownerV3, ownerV4, ownerV5, ownerV6, ownerV7].forEach(v => {
        if (v) {
          v.classList.remove('active');
          v.scrollTop = 0;
        }
      });
      if (viewEl) viewEl.classList.add('active');
    }

    function switchBuyerView(viewEl) {
      [buyerV1, buyerV2, buyerV3, buyerV4, buyerV5, buyerV6].forEach(v => {
        if (v) {
          v.classList.remove('active');
          v.scrollTop = 0;
        }
      });
      if (viewEl) viewEl.classList.add('active');
    }

    const activeTicker = { owner: null, buyer: null };
    function setTicker(phone, stepNum) {
      const prefix = phone === 'owner' ? 'tickerStep' : 'buyerTickerStep';
      const currentStep = activeTicker[phone];
      if (currentStep === stepNum) return;

      const currentItem = currentStep
        ? document.getElementById(`${prefix}${currentStep}`)
        : null;
      const nextItem = document.getElementById(`${prefix}${stepNum}`);

      if (currentItem) {
        currentItem.classList.remove('active');
        currentItem.classList.add('exiting');
        setTimeout(() => currentItem.classList.remove('exiting'), 350);
      }
      if (nextItem) nextItem.classList.add('active');
      activeTicker[phone] = stepNum;
    }

    function clearTicker(phone) {
      const prefix = phone === 'owner' ? 'tickerStep' : 'buyerTickerStep';
      const currentStep = activeTicker[phone];
      const currentItem = currentStep
        ? document.getElementById(`${prefix}${currentStep}`)
        : null;
      if (currentItem) {
        currentItem.classList.remove('active');
        currentItem.classList.add('exiting');
        setTimeout(() => currentItem.classList.remove('exiting'), 350);
      }
      activeTicker[phone] = null;
    }

    // Typing animation simulation
    function typeText(element, text, speed = 25) {
      return new Promise(resolve => {
        element.classList.add('focused');
        element.textContent = '';
        let index = 0;
        const interval = setInterval(() => {
          if (index < text.length) {
            element.textContent += text[index];
            index++;
          } else {
            clearInterval(interval);
            element.classList.remove('focused');
            resolve();
          }
        }, speed);
      });
    }

    // Quickstart Copy Button Event
    const btnCopyQuickStart = document.getElementById('btnCopyQuickStart');
    const quickStartCopyText = document.getElementById('quickStartCopyText');
    if (btnCopyQuickStart) {
      btnCopyQuickStart.addEventListener('click', async () => {
        const cmd = 'git clone https://github.com/b4n6-b4n6/openshop.git';
        try {
          await navigator.clipboard.writeText(cmd);
          btnCopyQuickStart.classList.add('copied');
          quickStartCopyText.textContent = 'Copied!';
          setTimeout(() => {
            btnCopyQuickStart.classList.remove('copied');
            quickStartCopyText.textContent = 'Copy';
          }, 2000);
        } catch (err) {
          btnCopyQuickStart.classList.add('copied');
          quickStartCopyText.textContent = 'Copied!';
          setTimeout(() => {
            btnCopyQuickStart.classList.remove('copied');
            quickStartCopyText.textContent = 'Copy';
          }, 2000);
        }
      });
    }

    const CAPTION_DURATION = 3000;
    const delay = (ms) => new Promise(res => setTimeout(res, ms));
    const startCaption = (phone, stepNum) => {
      setTicker(phone, stepNum);
      return performance.now();
    };
    const finishCaption = async (startedAt) => {
      const remaining = CAPTION_DURATION - (performance.now() - startedAt);
      console.log(remaining);
      if (remaining > 0) await delay(remaining);
    };

    let simulationStarted = false;
    function startScenarioOnce() {
      if (simulationStarted) return;
      simulationStarted = true;
      runMasterScenario();
    }

    async function runMasterScenario() {
      while (true) {
        // --- STAGE 0: RESET ALL STATES ---
        for (let i = 1; i <= 7; i++) {
          const items = [
            document.getElementById(`tickerStep${i}`),
            document.getElementById(`buyerTickerStep${i}`)
          ];
          items.forEach(item => {
            if (!item) return;
            item.classList.remove('active');
            item.classList.remove('exiting');
          });
        }
        activeTicker.owner = null;
        activeTicker.buyer = null;
        let ownerCaptionStarted = startCaption('owner', 1);

        hideCursor(ownerCursor);
        hideCursor(buyerCursor);
        if (ownerQrModal) ownerQrModal.classList.remove('open');

        const elInputAddress = document.getElementById('inputAddress');
        const elInputViewKey = document.getElementById('inputViewKey');
        const elInputHeight = document.getElementById('inputHeight');
        const elInputProdName = document.getElementById('inputProdName');
        const elInputProdDesc = document.getElementById('inputProdDesc');
        const elPhotoPickerLabel = document.getElementById('photoPickerLabel');
        const elPhotoPickerBox = document.getElementById('photoPickerBox');
        const elPhotoPickerThumb = document.getElementById('photoPickerThumb');
        const elPhotoPickerIcon = document.getElementById('photoPickerIcon');
        const elInputProdPrice = document.getElementById('inputProdPrice');
        const elInputProdQty = document.getElementById('inputProdQty');
        const elInputShopOnion = document.getElementById('inputShopOnion');

        if (elInputAddress) elInputAddress.textContent = '4…';
        if (elInputViewKey) elInputViewKey.textContent = 'secret view key';
        if (elInputHeight) elInputHeight.textContent = 'e.g. 3155600';
        if (elInputProdName) elInputProdName.textContent = 'Product name';
        if (elInputProdDesc) elInputProdDesc.textContent = 'Describe it…';
        if (elPhotoPickerLabel) elPhotoPickerLabel.textContent = 'Choose or drop image';
        if (elPhotoPickerThumb) elPhotoPickerThumb.style.display = 'none';
        if (elPhotoPickerIcon) elPhotoPickerIcon.style.display = 'block';
        if (elPhotoPickerBox) {
          elPhotoPickerBox.style.borderColor = 'var(--border)';
          elPhotoPickerBox.style.color = 'var(--text-faint)';
        }
        if (elInputProdPrice) elInputProdPrice.textContent = '0.00';
        if (elInputProdQty) elInputProdQty.textContent = '1';
        if (elInputShopOnion) elInputShopOnion.textContent = '';

        // Reset Invoice state
        if (orderStatusBadge) orderStatusBadge.className = 'indicator-pill syncing';
        if (orderStatusBadgeText) orderStatusBadgeText.textContent = 'Pending';
        if (buyerTxStatusNotice) {
          buyerTxStatusNotice.style.borderColor = 'var(--border)';
          buyerTxStatusNotice.style.background = 'var(--bg-surface-2)';
          buyerTxStatusNotice.style.color = 'var(--text-muted)';
        }
        if (buyerTxStatusText) buyerTxStatusText.textContent = 'Waiting for incoming transaction';
        if (buyerTxidBox) buyerTxidBox.style.display = 'none';

        const bMsg1 = document.getElementById('buyerChatMsg1');
        const oMsg1 = document.getElementById('ownerChatMsg1');
        const bMsg2 = document.getElementById('buyerChatMsg2');
        const oMsg2 = document.getElementById('ownerChatMsg2');
        if (bMsg1) bMsg1.classList.remove('pop-in');
        if (oMsg1) oMsg1.classList.remove('pop-in');
        if (bMsg2) bMsg2.classList.remove('pop-in');
        if (oMsg2) oMsg2.classList.remove('pop-in');

        const oInput = document.getElementById('ownerChatInput');
        if (oInput) {
          oInput.textContent = 'Message buyer…';
          oInput.classList.add('placeholder');
        }
        const bInput = document.getElementById('buyerChatInput');
        if (bInput) {
          bInput.textContent = 'Message seller…';
          bInput.classList.add('placeholder');
        }

        switchOwnerView(ownerV1);
        switchBuyerView(buyerV1);
        await delay(3900);

        // --- STEP 1: OWNER TAPS "OPEN NEW SHOP" ---
        await moveCursorToEl(ownerCursor, ownerViewport, 'btnOpenNewShop', 550);
        await tapCursor(ownerCursor);
        await delay(200);
        hideCursor(ownerCursor);

        await finishCaption(ownerCaptionStarted);
        // --- STEP 1b
        ownerCaptionStarted = startCaption('owner', 2);

        // Continue the same phase through wallet configuration.
        switchOwnerView(ownerV2);
        await delay(1400);
        
        // Tap Primary Address Field
        await moveCursorToEl(ownerCursor, ownerViewport, 'inputAddress', 450);
        await tapCursor(ownerCursor);
        if (elInputAddress) await typeText(elInputAddress, '888tX2mN17YKpnC9qZ5v10…', 16);
        await delay(200);

        // Tap Private View Key Field
        await moveCursorToEl(ownerCursor, ownerViewport, 'inputViewKey', 450);
        await tapCursor(ownerCursor);
        if (elInputViewKey) await typeText(elInputViewKey, 'a4b870c2f819e91ff0287…', 16);
        await delay(200);

        // Tap Restore Height Field
        await moveCursorToEl(ownerCursor, ownerViewport, 'inputHeight', 450);
        await tapCursor(ownerCursor);
        if (elInputHeight) await typeText(elInputHeight, '3200000', 30);
        await delay(3900);

        // Tap Create Shop Button
        await moveCursorToEl(ownerCursor, ownerViewport, 'btnCreateShop', 500);
        await tapCursor(ownerCursor);
        await delay(200);
        hideCursor(ownerCursor);
        await finishCaption(ownerCaptionStarted);

        // --- PHASE 2: START TOR AND ARRIVE AT THE STOREFRONT ---
        ownerCaptionStarted = startCaption('owner', 3);
        switchOwnerView(ownerV3);

        for (let p = 15; p <= 100; p += 13) {
          if (onionProgressPercent) onionProgressPercent.textContent = `${p}%`;
          await delay(1200);
        }

        await finishCaption(ownerCaptionStarted);
        // --- STEP 2b
        ownerCaptionStarted = startCaption('owner', 4);

        switchOwnerView(ownerV4);

        await delay(6300);

        await moveCursorToEl(ownerCursor, ownerViewport, 'btnStoreAddProduct', 550);
        await tapCursor(ownerCursor);
        await delay(250);
        hideCursor(ownerCursor);

        await finishCaption(ownerCaptionStarted);

        // --- PHASE 3: OPEN AND COMPLETE THE PRODUCT FORM ---
        ownerCaptionStarted = startCaption('owner', 5);

        switchOwnerView(ownerV5);
        await delay(2100);

        // Tap Product Name
        await moveCursorToEl(ownerCursor, ownerViewport, 'inputProdName', 450);
        await tapCursor(ownerCursor);
        if (elInputProdName) await typeText(elInputProdName, 'Coldcard Mk4', 20);
        await delay(200);

        // Tap Description
        await moveCursorToEl(ownerCursor, ownerViewport, 'inputProdDesc', 450);
        await tapCursor(ownerCursor);
        if (elInputProdDesc) await typeText(elInputProdDesc, 'Air-gapped signing device with dual secure elements.', 14);
        await delay(200);

        // Upload photo simulation
        await moveCursorToEl(ownerCursor, ownerViewport, 'photoPickerBox', 450);
        await tapCursor(ownerCursor);
        if (elPhotoPickerLabel) elPhotoPickerLabel.textContent = '✓ coldcard_mk4.png (11 KB)';
        if (elPhotoPickerThumb) elPhotoPickerThumb.style.display = 'block';
        if (elPhotoPickerIcon) elPhotoPickerIcon.style.display = 'none';
        if (elPhotoPickerBox) {
          elPhotoPickerBox.style.borderColor = 'var(--accent)';
          elPhotoPickerBox.style.color = 'var(--accent)';
        }
        await delay(300);

        // Price & Qty
        await moveCursorToEl(ownerCursor, ownerViewport, 'inputProdPrice', 400);
        await tapCursor(ownerCursor);
        if (elInputProdPrice) await typeText(elInputProdPrice, '0.85', 25);

        await moveCursorToEl(ownerCursor, ownerViewport, 'inputProdQty', 400);
        await tapCursor(ownerCursor);
        if (elInputProdQty) await typeText(elInputProdQty, '5', 25);
        await delay(3900);

        // Tap "Add product" button
        await moveCursorToEl(ownerCursor, ownerViewport, 'btnAddProductSubmit', 500);
        await tapCursor(ownerCursor);
        await delay(300);
        hideCursor(ownerCursor);

        // --- PHASE 4: SHARE THE READY STORE AND OPEN ITS PRODUCTS ---
        switchOwnerView(ownerV6);
        await delay(600);

        // Owner opens QR code modal
        await moveCursorToEl(ownerCursor, ownerViewport, 'btnOwnerQrTrigger', 500);
        await tapCursor(ownerCursor);
        ownerCaptionStarted = startCaption('owner', 6);
        if (ownerQrModal) ownerQrModal.classList.add('open');
        await delay(400);
        hideCursor(ownerCursor);
        await delay(4200);

        let buyerCaptionStarted = startCaption('buyer', 1);
        await moveCursorToEl(buyerCursor, buyerViewport, 'inputShopOnion', 500);
        await tapCursor(buyerCursor);
        if (elInputAddress) await typeText(elInputShopOnion, 'http://2p2…xmr.onion', 16);
        await delay(200);
        hideCursor(buyerCursor);
        
        // --- BUYER DETECTS LIVE ONION ADDRESS ---
        await delay(4100);

        // Buyer clicks "OPEN SHOP"
        await moveCursorToEl(buyerCursor, buyerViewport, 'btnBuyerConnect', 500);
        await tapCursor(buyerCursor);
        hideCursor(buyerCursor);
        await delay(250);

        await finishCaption(buyerCaptionStarted);
        buyerCaptionStarted = startCaption('buyer', 2);

        // Buyer lands on the shop and opens its products in the same phase.
        switchBuyerView(buyerV2);

        await delay(4100);
        await moveCursorToEl(buyerCursor, buyerViewport, 'btnBuyerShopProducts', 500);
        await tapCursor(buyerCursor);
        hideCursor(buyerCursor);
        await delay(300);
        await finishCaption(buyerCaptionStarted);
        buyerCaptionStarted = startCaption('buyer', 5);
        switchBuyerView(buyerV3);

        // --- BUYER PHASE 2: REVIEW THE LISTING AND PRODUCT DETAILS ---
        await delay(3700);

        // Buyer taps on "Purchase" button on product listing
        await moveCursorToEl(buyerCursor, buyerViewport, 'btnBuyerListingPurchase', 450);
        await tapCursor(buyerCursor);
        /////
        await delay(300);
        await finishCaption(buyerCaptionStarted);
        
        // --- BUYER PHASE 3: PLACE THE ORDER AND CONFIRM PAYMENT ---
        buyerCaptionStarted = startCaption('buyer', 6);
        switchBuyerView(buyerV4);
        await delay(4100);

        await moveCursorToEl(buyerCursor, buyerViewport, 'btnSubmitPurchaseOrder', 500);
        await tapCursor(buyerCursor);
        hideCursor(buyerCursor);
        await delay(300);

        // Lands on Monero Invoice (orderPage.js)
        switchBuyerView(buyerV5);
        await delay(2400);

        // Simulate Transaction Detection
        await delay(1200);
        if (buyerTxStatusNotice) {
          buyerTxStatusNotice.style.borderColor = 'rgba(246, 178, 60, 0.4)';
          buyerTxStatusNotice.style.background = 'var(--warning-soft)';
          buyerTxStatusNotice.style.color = 'var(--warning)';
        }
        if (buyerTxStatusText) buyerTxStatusText.textContent = 'Incoming transaction detected (0/10)';
        if (orderStatusBadge) orderStatusBadge.className = 'indicator-pill syncing';
        if (orderStatusBadgeText) orderStatusBadgeText.textContent = 'Detected';
        await delay(1200);

        // Simulate Transaction Confirmation (10/10)
        if (buyerTxStatusNotice) {
          buyerTxStatusNotice.style.borderColor = 'rgba(52, 211, 154, 0.4)';
          buyerTxStatusNotice.style.background = 'var(--success-soft)';
          buyerTxStatusNotice.style.color = 'var(--success)';
        }
        if (buyerTxStatusText) buyerTxStatusText.textContent = '✓ Incoming transaction confirmed';
        if (orderStatusBadge) orderStatusBadge.className = 'indicator-pill';
        if (orderStatusBadgeText) orderStatusBadgeText.textContent = 'Paid';
        if (buyerTxidBox) buyerTxidBox.style.display = 'block';
        await delay(3900);

        // Close owner's QR modal to reveal dashboard
        if (ownerQrModal) ownerQrModal.classList.remove('open');
        await delay(300);

        // Buyer taps "Chat with seller"
        await moveCursorToEl(buyerCursor, buyerViewport, 'btnBuyerOpenChat', 500);
        await tapCursor(buyerCursor);
        hideCursor(buyerCursor);
        await delay(300);
        await Promise.all([
          finishCaption(buyerCaptionStarted),
          finishCaption(ownerCaptionStarted),
        ])

        // --- STEP 7: BOTH PHONES IN REAL-TIME E2E CHAT ---
        ownerCaptionStarted = startCaption('owner', 7);
        buyerCaptionStarted = startCaption('buyer', 7);
        switchOwnerView(ownerV7);
        switchBuyerView(buyerV6);
        await delay(3100);

        // Buyer focuses input and types
        const buyerChatEl = document.getElementById('buyerChatInput');
        await moveCursorToEl(buyerCursor, buyerViewport, 'buyerChatInput', 450, 0.25, 0.5);
        await tapCursor(buyerCursor);
        if (buyerChatEl) {
          buyerChatEl.classList.remove('placeholder');
          await typeText(buyerChatEl, 'Can you ship with stealth packaging?', 22);
        }
        await delay(200);

        // Buyer taps Send button
        await moveCursorToEl(buyerCursor, buyerViewport, 'btnBuyerSendMsg', 350);
        await tapCursor(buyerCursor);
        hideCursor(buyerCursor);

        // Clear buyer input and pop message 1 from the bottom on both phones!
        if (buyerChatEl) {
          buyerChatEl.textContent = 'Message seller…';
          buyerChatEl.classList.add('placeholder');
        }

        const buyerMsg1 = document.getElementById('buyerChatMsg1');
        const ownerMsg1 = document.getElementById('ownerChatMsg1');
        if (buyerMsg1) buyerMsg1.classList.add('pop-in');
        if (ownerMsg1) ownerMsg1.classList.add('pop-in');
        await delay(1200);

        // Owner focuses input and replies
        const ownerChatEl = document.getElementById('ownerChatInput');
        await moveCursorToEl(ownerCursor, ownerViewport, 'ownerChatInput', 450, 0.25, 0.5);
        await tapCursor(ownerCursor);
        if (ownerChatEl) {
          ownerChatEl.classList.remove('placeholder');
          await typeText(ownerChatEl, 'Packed & vacuum-sealed. Dispatched today! 📦', 18);
        }
        await delay(200);

        // Owner taps Send button
        await moveCursorToEl(ownerCursor, ownerViewport, 'btnOwnerSendMsg', 350);
        await tapCursor(ownerCursor);
        hideCursor(ownerCursor);

        // Clear owner input and pop message 2 from the bottom on both phones!
        if (ownerChatEl) {
          ownerChatEl.textContent = 'Message buyer…';
          ownerChatEl.classList.add('placeholder');
        }

        const ownerMsg2 = document.getElementById('ownerChatMsg2');
        const buyerMsg2 = document.getElementById('buyerChatMsg2');
        if (ownerMsg2) ownerMsg2.classList.add('pop-in');
        if (buyerMsg2) buyerMsg2.classList.add('pop-in');

        await delay(18000);

        // Pause at completed scenario state before loop restarts
        await Promise.all([
          finishCaption(ownerCaptionStarted),
          finishCaption(buyerCaptionStarted)
        ]);
      }
    }

    // Start scenario directly on initialization
    startScenarioOnce();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDemo);
  } else {
    initDemo();
  }
})();
