const { extractNVCWithFallback } = require('./nvc.js');
extractNVCWithFallback('I feel very sad').then(console.log).catch(console.error);