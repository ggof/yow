# yow

An ultra-lightweight, zero-dependency library that turns your multi-page app into a fast, AJAX-driven experience — with no configuration required.

yow intercepts link clicks and form submissions, fetches the target page in the background, and swaps the content into the DOM. It also supports **Out-of-Band (OOB) template swaps** for fine-grained, partial-page updates — making it a great pairing for server-rendered apps.

---

## How it works

Once included, yow:

1. Intercepts clicks on same-origin `<a>` links
2. Intercepts `<form>` submissions (GET and POST)
3. Fetches the target URL via `fetch()`, sending `X-Requested-With: XMLHttpRequest` and `X-Library: yow` headers so your server can detect the request
4. Parses the response HTML and either:
   - **Full swap**: Replaces the entire `<body>` and merges the `<head>` (default when the response is a full HTML page)
   - **OOB template swap**: Updates specific elements on the page (when the response contains only `<template>` tags)
5. Pushes the new URL to the browser history, so the back/forward buttons work correctly

---

## Installation

### Download the release

Go to the [Releases page](../../releases) and download one of the following files:

| File | Description |
|---|---|
| `yow.js` | Unminified, for development |
| `yow.min.js` | Minified, for production |
| `yow.min.js.gz` | Minified + Gzip compressed |
| `yow.min.js.br` | Minified + Brotli compressed |

### Serve it with your web server

Place the downloaded file in a publicly accessible directory on your web server (e.g., `/public/js/` or `/static/`).

If you use the `.gz` or `.br` variants, configure your server to serve them with the correct headers:

- **Gzip** (`yow.min.js.gz`): `Content-Encoding: gzip`, `Content-Type: application/javascript`
- **Brotli** (`yow.min.js.br`): `Content-Encoding: br`, `Content-Type: application/javascript`

### Add the script tag to your HTML

Include yow at the **bottom of your `<body>`**, before the closing `</body>` tag:

```html
<script src="/js/yow.min.js"></script>
```

That's it — no initialization, no configuration. yow starts working immediately.

---

## Usage

### Link interception

All same-origin links are automatically intercepted. No HTML changes needed.

```html
<!-- This will be handled by yow (AJAX navigation) -->
<a href="/about">About</a>

<!-- These will NOT be intercepted (external, modifier key, new tab, etc.) -->
<a href="https://example.com">External link</a>
<a href="/file.pdf" download>Download</a>
<a href="/page" target="_blank">Open in new tab</a>
```

When a user clicks an intercepted link, yow fetches the target page and performs a **full swap** — replacing the `<body>` content and merging the `<head>`.

### Form submission interception

All forms are automatically intercepted, regardless of method.

```html
<!-- GET form — query params are appended to the URL -->
<form action="/search" method="GET">
  <input name="q" type="text" />
  <button type="submit">Search</button>
</form>

<!-- POST form — body is sent as FormData -->
<form action="/contact" method="POST">
  <input name="email" type="email" />
  <textarea name="message"></textarea>
  <button type="submit">Send</button>
</form>
```

### Detecting yow requests on the server

yow sends two headers with every request:

```
X-Requested-With: XMLHttpRequest
X-Library: yow
```

You can use these to return a partial response (just a fragment, or OOB templates) instead of a full HTML page, which avoids re-rendering layouts and improves performance.

**Example (pseudo-code):**

```python
def handler(request):
    if request.headers.get("X-Library") == "yow":
        # Return a partial response or OOB templates
        return render("_partial.html")
    else:
        # Return the full page
        return render("page.html")
```

---

## Response types

### Full page swap (default)

When your server returns a **full HTML document**, yow replaces the entire `<body>` and intelligently merges the `<head>`:

- **`<title>`** — updated to the new page title
- **`<meta>`** — updated by `name` or `property` attribute; new ones are appended
- **`<link>`** — new stylesheets are appended (duplicates are skipped)
- **`<style>`** — new inline styles are appended (duplicates are skipped)
- **`<script>`** — new scripts are loaded (duplicates by `src` are skipped; inline scripts are always executed)

Any `<script>` tags newly present in the swapped `<body>` are also re-evaluated.

```html
<!-- Server returns a full HTML page -->
<!DOCTYPE html>
<html>
  <head>
    <title>New Page Title</title>
    <link rel="stylesheet" href="/css/new-page.css">
  </head>
  <body>
    <h1>New page content</h1>
  </body>
</html>
```

### Out-of-Band (OOB) template swaps

When your server returns a response where **every top-level element is a `<template>`**, yow performs targeted partial updates instead of a full body swap.

This is useful for updating specific parts of the page (e.g., a notification count, a list, a modal) without re-rendering everything.

Each `<template>` must identify its target element and optionally specify a swap mode.

**Attributes:**

| Attribute | Description | Default |
|---|---|---|
| `data-target` | Any CSS selector used to find the target (takes priority over `id`) | — |
| `data-mode` | How to insert the content (see modes below) | `innerHTML` |

**Swap modes (`data-mode`):**

| Mode | Description |
|---|---|
| `innerHTML` | Replaces the inner content of the target (default) |
| `outerHTML` / `replace` | Replaces the target element itself |
| `beforebegin` | Inserts before the target element |
| `afterbegin` | Inserts at the start of the target's children |
| `beforeend` | Inserts at the end of the target's children |
| `afterend` | Inserts after the target element |
| `delete` | Removes the target element (template content is ignored) |

**Example — OOB response from the server:**

```html
<!-- Response contains only <template> tags — OOB mode is activated -->

<!-- Replace the inner content of #notification-count -->
<template data-target="#notification-count">
  <span>5</span>
</template>

<!-- Prepend a new item to #message-list -->
<template data-target="#message-list" data-mode="afterbegin">
  <li>New message from Alice</li>
</template>

<!-- Remove the loading spinner -->
<template data-target="#spinner" data-mode="delete"></template>
```

> [!IMPORTANT]
> A response is treated as OOB **only** if every element is a `<template>`. If even one non-template element is present, yow falls back to a full page swap.

---

## Browser history

yow automatically manages browser history:

- **Link clicks / form submissions**: `history.pushState()` is called with the final response URL, so the address bar updates and the back button works.
- **Back/forward navigation**: yow listens for `popstate` events and re-fetches the URL to restore the correct page content.
- **Modifier keys**: Holding `Ctrl`, `Meta`, `Shift`, or `Alt` while clicking a link bypasses yow entirely, allowing the browser to handle it natively (e.g., open in a new tab).

---

## Building from source

```bash
# Install dependencies
pnpm install

# Build all bundles (unminified, minified, gzip, brotli)
pnpm run build
```

Outputs are written to the `dist/` directory.

---

## Development

`yow` offers a server script for user tests under `scripts/server.js`. Just run `pnpm run server` for testing the implementation.

---

## License

MIT
