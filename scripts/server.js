const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

function getFormField(body, fieldName) {
  const regex = new RegExp(`name="${fieldName}"\\r\\n\\r\\n([^\\r\\n]*)`);
  const match = body.match(regex);
  return match ? match[1] : '';
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log(`[${req.method}] ${url.pathname}${url.search}`);

  // Serve yow.js library
  if (url.pathname === '/yow.js') {
    fs.readFile(path.join(__dirname, 'yow.js'), (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading yow.js');
      } else {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(data);
      }
    });
    return;
  }

  // Home Page / Index
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Yow.js - Home</title>
        <script src="/yow.js"></script>
        <style>
          body { font-family: sans-serif; max-width: 650px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
          .nav { margin-bottom: 20px; }
          .nav a { margin-right: 15px; text-decoration: none; color: #0076d6; font-weight: bold; }
          .box { padding: 15px; background: #f0f0f0; border-radius: 5px; margin-top: 20px; }
          form { display: flex; flex-direction: column; gap: 15px; margin-top: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 5px; background: #fafafa; }
          .form-group { display: flex; flex-direction: column; gap: 5px; }
          .mode-options { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 5px; }
          .mode-options label { font-size: 14px; background: #eee; padding: 3px 8px; border-radius: 3px; cursor: pointer; }
          input[type="text"], button { padding: 8px; font-size: 16px; }
          button { background: #0076d6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
          button:hover { background: #005bb5; }
        </style>
      </head>
      <body data-page="home">
        <h1>Yow.js Test Page</h1>
        <div class="nav">
          <a href="/">Home</a>
          <a href="/about">About Us</a>
          <a href="https://google.com" target="_blank">External Link (New Tab)</a>
        </div>

        <div class="box">
          <p>Welcome to Yow.js! This is the home page. Try clicking the "About Us" link to see if the page contents swap without a full reload.</p>
        </div>

        <div style="margin-top: 30px;">
          <h3>OOB Swap Target Elements</h3>
          
          <div id="oob-target-1" class="box" style="border: 2px dashed #ff9900; background: #fffdf5;">
            <p><strong>OOB Target 1:</strong> This block will be swapped OOB.</p>
            <p id="oob-status-1" style="font-weight: bold; color: gray;">OOB script 1 not yet executed.</p>
          </div>

          <div id="oob-target-2" class="box" style="border: 2px dashed #0099ff; background: #f5faff;">
            <p><strong>OOB Target 2:</strong> This block will be swapped OOB.</p>
            <p id="oob-status-2" style="font-weight: bold; color: gray;">OOB script 2 not yet executed.</p>
          </div>
        </div>
        
        <h2>Test Form Submission (GET)</h2>
        <form action="/submit" method="GET">
          <div class="form-group">
            <label>Name: <input type="text" name="name" required></label>
          </div>
          <button type="submit">Submit GET</button>
        </form>

        <h2>Test Form Submission (POST)</h2>
        <form action="/submit" method="POST">
          <div class="form-group">
            <label>Message: <input type="text" name="message" required></label>
          </div>
          <button type="submit">Submit POST</button>
        </form>

        <h2>Test OOB Single-Template Swapping (POST)</h2>
        <form action="/submit-oob-single" method="POST">
          <div class="form-group">
            <label>OOB Text 1: <input type="text" name="oob_text_1" value="Single Swapped Text" required></label>
          </div>
          
          <div class="form-group">
            <strong>Swap Mode for Target 1:</strong>
            <div class="mode-options">
              <label><input type="radio" name="mode_1" value="innerHTML" checked> innerHTML</label>
              <label><input type="radio" name="mode_1" value="outerHTML"> outerHTML</label>
              <label><input type="radio" name="mode_1" value="beforebegin"> beforebegin</label>
              <label><input type="radio" name="mode_1" value="afterbegin"> afterbegin</label>
              <label><input type="radio" name="mode_1" value="beforeend"> beforeend</label>
              <label><input type="radio" name="mode_1" value="afterend"> afterend</label>
              <label><input type="radio" name="mode_1" value="delete"> delete</label>
            </div>
          </div>
          <button type="submit">Submit Single-OOB Swap</button>
        </form>

        <h2>Test OOB Multi-Templates Swapping (POST)</h2>
        <form action="/submit-oob-multi" method="POST">
          <div class="form-group">
            <label>OOB Text 1: <input type="text" name="oob_text_1" value="First Swapped Text" required></label>
          </div>
          
          <div class="form-group">
            <strong>Swap Mode for Target 1:</strong>
            <div class="mode-options">
              <label><input type="radio" name="mode_1" value="innerHTML" checked> innerHTML</label>
              <label><input type="radio" name="mode_1" value="outerHTML"> outerHTML</label>
              <label><input type="radio" name="mode_1" value="beforebegin"> beforebegin</label>
              <label><input type="radio" name="mode_1" value="afterbegin"> afterbegin</label>
              <label><input type="radio" name="mode_1" value="beforeend"> beforeend</label>
              <label><input type="radio" name="mode_1" value="afterend"> afterend</label>
              <label><input type="radio" name="mode_1" value="delete"> delete</label>
            </div>
          </div>

          <hr style="border: none; border-top: 1px solid #ccc; width: 100%;">

          <div class="form-group">
            <label>OOB Text 2: <input type="text" name="oob_text_2" value="Second Swapped Text" required></label>
          </div>

          <div class="form-group">
            <strong>Swap Mode for Target 2:</strong>
            <div class="mode-options">
              <label><input type="radio" name="mode_2" value="innerHTML" checked> innerHTML</label>
              <label><input type="radio" name="mode_2" value="outerHTML"> outerHTML</label>
              <label><input type="radio" name="mode_2" value="beforebegin"> beforebegin</label>
              <label><input type="radio" name="mode_2" value="afterbegin"> afterbegin</label>
              <label><input type="radio" name="mode_2" value="beforeend"> beforeend</label>
              <label><input type="radio" name="mode_2" value="afterend"> afterend</label>
              <label><input type="radio" name="mode_2" value="delete"> delete</label>
            </div>
          </div>

          <button type="submit">Submit Multi-OOB Swap</button>
        </form>
      </body>
      </html>
    `);
    return;
  }

  // About Us Page
  if (url.pathname === '/about') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Yow.js - About Us</title>
        <script src="/yow.js"></script>
        <style>
          body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; line-height: 1.6; }
          .nav { margin-bottom: 20px; }
          .nav a { margin-right: 15px; text-decoration: none; color: #0076d6; font-weight: bold; }
          .box { padding: 15px; background: #e0f0ff; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body data-page="about">
        <h1>About Yow.js</h1>
        <div class="nav">
          <a href="/">Home</a>
          <a href="/about">About Us</a>
        </div>
        <div class="box">
          <p>This is the About page loaded via yow.js! Since the body and headers are swapped, you should see this blue box instead of the grey one from the home page.</p>
          <p id="about-status" style="color: red; font-weight: bold;">Script not executed.</p>
        </div>
        <script>
          // Verify body script execution
          document.getElementById('about-status').textContent = 'Script successfully executed inside body!';
          document.getElementById('about-status').style.color = 'green';
        </script>
      </body>
      </html>
    `);
    return;
  }

  // Form Submit Handler
  if (url.pathname === '/submit') {
    if (req.method === 'GET') {
      const name = url.searchParams.get('name') || 'Stranger';
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Yow.js - GET Result</title>
          <script src="/yow.js"></script>
          <style>
            body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
            .nav { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Submission Success (GET)</h1>
          <div class="nav"><a href="/">Back Home</a></div>
          <p>Hello, <strong>${name}</strong>! Your form was successfully submitted using GET via yow.js.</p>
        </body>
        </html>
      `);
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        console.log('Received POST payload body:', body);
        
        let message = 'Form submitted!';
        const match = body.match(/name="message"\r\n\r\n([^\r\n]*)/);
        if (match) {
          message = match[1];
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <title>Yow.js - POST Result</title>
            <script src="/yow.js"></script>
            <style>
              body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
              .nav { margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <h1>Submission Success (POST)</h1>
            <div class="nav"><a href="/">Back Home</a></div>
            <p>You sent the message: <strong>${message}</strong> via POST!</p>
          </body>
          </html>
        `);
      });
    }
    return;
  }

  // OOB Single-Template Submit Handler
  if (url.pathname === '/submit-oob-single' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      console.log('Received OOB Single POST payload body:', body);
      
      const oobText1 = getFormField(body, 'oob_text_1') || 'Hello OOB 1!';
      const mode1 = getFormField(body, 'mode_1') || 'innerHTML';

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <template data-target="#oob-target-1" data-mode="${mode1}">
          <p><strong>Target 1 Swapped (Single):</strong> <em>${oobText1}</em> (Mode: ${mode1})</p>
          <p id="oob-status-1" style="font-weight: bold; color: green;">OOB script 1 successfully executed!</p>
          <script>
            console.log("OOB Single swap script successfully executed!");
          </script>
        </template>
      `);
    });
    return;
  }

  // OOB Multi-Templates Submit Handler
  if (url.pathname === '/submit-oob-multi' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      console.log('Received OOB Multi POST payload body:', body);
      
      const oobText1 = getFormField(body, 'oob_text_1') || 'Hello OOB 1!';
      const oobText2 = getFormField(body, 'oob_text_2') || 'Hello OOB 2!';
      const mode1 = getFormField(body, 'mode_1') || 'innerHTML';
      const mode2 = getFormField(body, 'mode_2') || 'innerHTML';

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <template data-target="#oob-target-1" data-mode="${mode1}">
          <p><strong>Target 1 Swapped (Multi):</strong> <em>${oobText1}</em> (Mode: ${mode1})</p>
          <p id="oob-status-1" style="font-weight: bold; color: green;">OOB script 1 successfully executed!</p>
          <script>
            console.log("OOB 1 (Multi) swap script successfully executed!");
          </script>
        </template>
        <template data-target="#oob-target-2" data-mode="${mode2}">
          <p><strong>Target 2 Swapped (Multi):</strong> <em>${oobText2}</em> (Mode: ${mode2})</p>
          <p id="oob-status-2" style="font-weight: bold; color: green;">OOB script 2 successfully executed!</p>
          <script>
            console.log("OOB 2 (Multi) swap script successfully executed!");
          </script>
        </template>
      `);
    });
    return;
  }

  // Not Found
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
});
