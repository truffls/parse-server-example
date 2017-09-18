// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var ios_pfx_dev = path.join(__dirname, 'ios_pfx', process.env.FLAVOUR + '-' + process.env.ENVIRONMENT + '-dev.p12');
var ios_pfx_prod = path.join(__dirname, 'ios_pfx', process.env.FLAVOUR + '-' + process.env.ENVIRONMENT + '-prod.p12');

console.log('ios_pfx_dev: ' + ios_pfx_dev);
console.log('ios_pfx_prod: ' + ios_pfx_prod);

var ios_certs = [
  {
    pfx: ios_pfx_prod,
    passphrase: '', // optional password to your p12/PFX
    bundleId: process.env.IOS_BUNDLE_ID || 'setMe',
    production: true
  }
];

if (process.env.ENVIRONMENT != 'live') {
  dev_cert = {
    pfx: ios_pfx_dev,
    passphrase: '', // optional password to your p12/PFX
    bundleId: process.env.IOS_BUNDLE_ID || 'setMe',
    production: false
  };
  ios_certs.push(dev_cert)
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || '', // Add your master key here. Keep it secret!
  fileKey: process.env.FILE_KEY || '', // Add the file key to provide access to files already hosted on Parse
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  push: {
    android: {
      senderId: process.env.GCM_SENDER_ID || 'setMe',
      apiKey: process.env.GCM_API_KEY || 'setMe'
    },
    ios: ios_certs
  },
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
