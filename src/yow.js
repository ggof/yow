(function () {
  'use strict';

  // 1. HELPER: Check if anchor click should be intercepted
  function shouldInterceptLink(anchor, event) {
    if (!anchor) return false;

    const href = anchor.getAttribute('href');
    if (!href) return false;

    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return false;

    const url = new URL(anchor.href, window.location.origin);
    if (!url.protocol.startsWith('http')) return false;
    if (url.origin !== window.location.origin) return false;
    if (anchor.target && anchor.target !== '_self') return false;
    if (anchor.hasAttribute('download')) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return false;

    return true;
  }

  // 2. HEAD PROCESSING FUNCTIONS
  function processTitle(el, _curHead) {
    document.title = el.textContent;
  }

  // Meta tag processing
  function processMeta(el, curHead) {
    const name = el.getAttribute('name');
    const property = el.getAttribute('property');
    let curMeta = null;

    if (name) {
      curMeta = curHead.querySelector(`meta[name="${name}"]`);
    } else if (property) {
      curMeta = curHead.querySelector(`meta[property="${property}"]`);
    }

    if (curMeta) {
      curMeta.setAttribute('content', el.getAttribute('content'));
    } else {
      curHead.appendChild(el.cloneNode(true));
    }
  }

  // Link tag processing
  function processLink(el, curHead) {
    const href = el.getAttribute('href');
    if (href && !curHead.querySelector(`link[href="${href}"]`)) {
      curHead.appendChild(el.cloneNode(true));
    }
  }

  // Style tag processing
  function processStyle(el, curHead) {
    const exists = Array.from(curHead.querySelectorAll('style')).some(s => s.textContent === el.textContent);
    if (!exists) {
      curHead.appendChild(el.cloneNode(true));
    }
  }

  // Script tag processing
  function processScript(el, curHead) {
    const src = el.getAttribute('src');
    if (src) {
      if (!curHead.querySelector(`script[src="${src}"]`)) {
        const script = document.createElement('script');
        for (const attr of el.attributes) {
          script.setAttribute(attr.name, attr.value);
        }
        curHead.appendChild(script);
      }
      return;
    }

    // Inline script
    const script = document.createElement('script');
    script.textContent = el.textContent;
    for (const attr of el.attributes) {
      script.setAttribute(attr.name, attr.value);
    }
    curHead.appendChild(script);
  }

  const headProcessors = {
    TITLE: processTitle,
    META: processMeta,
    LINK: processLink,
    STYLE: processStyle,
    SCRIPT: processScript
  };

  // 3. HEAD MERGING CENTRAL LOOP
  function mergeHead(newHead) {
    if (!newHead) return;
    const curHead = document.head;

    for (const el of Array.from(newHead.children)) {
      const processor = headProcessors[el.tagName];
      if (processor) {
        processor(el, curHead);
      }
    }
  }

  // 4. DYNAMIC BODY SCRIPT EVALUATION
  function evaluateNewScripts(existingScripts) {
    const allScripts = document.body.querySelectorAll('script');
    for (const scriptEl of Array.from(allScripts)) {
      if (!existingScripts.has(scriptEl)) {
        const newScript = document.createElement('script');
        for (const attr of scriptEl.attributes) {
          newScript.setAttribute(attr.name, attr.value);
        }
        newScript.textContent = scriptEl.textContent;
        scriptEl.parentNode.replaceChild(newScript, scriptEl);
      }
    }
  }

  // 5. DOM SWAP UTILITIES
  function swapElement(target, mode, html) {
    switch (mode) {
      case 'beforebegin':
      case 'afterbegin':
      case 'beforeend':
      case 'afterend':
        target.insertAdjacentHTML(mode, html);
        break;
      case 'innerHTML':
        target.innerHTML = html;
        break;
      case 'outerHTML':
      case 'replace':
        target.outerHTML = html;
        break;
      case 'delete':
        target.remove();
        break;
    }
  }

  function processTemplates(templates) {
    for (const template of templates) {
      const selector = template.dataset.target;
      if (!selector) continue;

      const target = document.querySelector(selector);
      if (!target) continue;

      const mode = template.dataset.mode || 'innerHTML';
      swapElement(target, mode, template.innerHTML);
    }
  }

  function processFullSwap(doc, pushToHistory, url) {
    mergeHead(doc.head);

    document.body.innerHTML = doc.body.innerHTML;
    for (const attr of doc.body.attributes) {
      document.body.setAttribute(attr.name, attr.value);
    }

    if (pushToHistory) {
      history.pushState({ yow: true }, '', url);
    }
  }

  // 6. RESPONSE PROCESSING (Body swap OR OOB Template swaps)
  function handleResponse(response, pushToHistory) {
    if (!response.ok && response.status !== 422) {
      console.warn('yow.js: Request failed with status', response.status);
      return Promise.resolve();
    }

    return response.text().then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      if (!doc.body) return;

      const allElements = Array.from(doc.querySelectorAll('body *, head *'));
      const isTemplates = allElements.length > 0 && allElements.every(el => el.tagName === 'TEMPLATE');
      const existingScripts = new Set(document.body.querySelectorAll('script'));

      if (isTemplates) {
        processTemplates(allElements);
      } else {
        processFullSwap(doc, pushToHistory, response.url);
      }

      // Execute newly inserted script elements in the body
      evaluateNewScripts(existingScripts);
    });
  }

  // 6. TOP LEVEL HANDLER FUNCTIONS
  function handleLinkClick(event) {
    const anchor = event.target.closest('a');
    if (!shouldInterceptLink(anchor, event)) return;

    event.preventDefault();

    fetch(anchor.href, {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-Library': 'yow'
      }
    })
      .then(response => handleResponse(response, true))
      .catch(err => console.error('yow.js fetch error:', err));
  }

  function handleFormSubmit(event) {
    const form = event.target.closest('form');
    if (!form) return;

    event.preventDefault();

    const action = form.getAttribute('action') || window.location.href;
    const method = (form.getAttribute('method') || 'GET').toUpperCase();

    const fetchOptions = {
      method: method,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-Library': 'yow'
      }
    };

    let fetchUrl = action;
    const formData = new FormData(form);

    if (method === 'GET') {
      const url = new URL(action, window.location.origin);
      for (const [key, value] of formData.entries()) {
        url.searchParams.append(key, value);
      }
      fetchUrl = url.toString();
    } else if (Array.from(formData.values()).some(it => it instanceof File)) {
      fetchOptions.body = formData;
    } else {
      fetchOptions.body = new URLSearchParams(formData)
    }

    fetch(fetchUrl, fetchOptions)
      .then(response => handleResponse(response, true))
      .catch(err => console.error('yow.js fetch error:', err));
  }

  function handlePopState() {
    fetch(window.location.href, {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-Library': 'yow'
      }
    })
      .then(response => handleResponse(response, false))
      .catch(err => console.error('yow.js popstate fetch error:', err));
  }

  // 7. LISTENERS REGISTRATION
  document.addEventListener('click', handleLinkClick);
  document.addEventListener('submit', handleFormSubmit);
  window.addEventListener('popstate', handlePopState);

  // Initialize state so we can track initial load if needed
  if (!history.state) {
    history.replaceState({ yow: true }, '', window.location.href);
  }

  console.log('yow.js: Initialized Phase 3 (OOB Template Swaps)');
})();
