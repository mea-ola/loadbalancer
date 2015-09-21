var express = require('express'),
    app     = express(),
    rp      = require('request'),
    Rx      = require('rx'),
    HandleBars = require('handlebars'),
    fs = require('fs'),
    bodyParse = require('body-parser')
;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var request = Rx.Observable.fromNodeCallback(rp);
var template = fs.readFileSync('./templates/nginx.hbs').toString('utf8');
var configTemplate = HandleBars.compile(template);

app.use(bodyParse.json());

app.post('/', function (req, res) {
  if (req.body.eventType == 'deployment_success') {
    console.log(req.body);
    genConfig()
    .subscribe(function (config) {
      fs.writeFileSync('/nginx/conf/nginx.conf', config);
      var pid = fs.readFileSync('/nginx/logs/nginx.pid').toString('utf8');
      process.kill(pid, 'SIGHUP');
    });
  }
  res.send('ok')
})

app.get('/', function (req, res) {
  genConfig()
  .subscribe(function (config) {
    res.send(config);
  });
});

function genConfig () {
  return request({ 
    method: 'GET',
    url: 'http://10.134.51.26:8080/v2/apps',
    headers: { authorization: 'Basic YWRtaW46bWVhb2xh' } 
  })
  .map( function (response) {
    return JSON.parse(response[0].body);
  })
  .concatMap(function (app) {
    return Rx.Observable.fromArray(app.apps);
  })
  .concatMap( function (body) {
    return request({ 
      method: 'GET',
      url: 'http://10.134.51.26:8080/v2/apps/' + body.id,
      headers: { authorization: 'Basic YWRtaW46bWVhb2xh' } 
    })
  })
  .map( function (response) {
    return JSON.parse(response[0].body).app;
  })
  .map( function (app) {
    return {
      id: app.id,
      labels: app.labels,
      tasks: app.tasks
    }
  })
  .filter( function (app) {
    return app.labels.public == "true";
  })
  .map( function (app) {
    var names = app.id.split('/');
    names.shift();
    app.id = names.join('_');
    return app;
  })
  .takeLast()
  .reduce( function (pre, item) { pre.push(item); return pre;}, [])
  .map( function (ctx) {
    return configTemplate({ apps: ctx });
  })
}

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});