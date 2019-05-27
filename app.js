const http = require('http')
const fs = require('fs')
const path = require('path')

http.createServer(function (req, res) {
  if (req.url == '/' || req.url == '/index.html') {
    fs.readFile('./index.html', (err, data) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(data);
      res.end();
    });
  } else {
    let reqExt = path.extname(req.url);
    if (reqExt == '.wasm') {
      fs.readFile('./' + req.url, (err, data) => {
        res.writeHead(200, { 'Content-Type': 'application/wasm' });
        res.write(data);
        res.end();
      });
    }
  }
}).listen(8081);

console.log('Server running at http://127.0.0.1:8081/');