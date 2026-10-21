const fs = require('fs');

console.log('Heart char code:', '♥'.charCodeAt(0).toString(16), '♥'.codePointAt(0));
console.log('Star char code:', '★'.charCodeAt(0).toString(16), '★'.codePointAt(0));

// Check if UTF-8 bytes match
const heartBuf = Buffer.from('♥', 'utf8');
const starBuf = Buffer.from('★', 'utf8');
console.log('Heart UTF-8 bytes:', heartBuf);
console.log('Star UTF-8 bytes:', starBuf);

// Check if Windows-1252 / ANSI decoding produces '?'
console.log('Heart as latin1:', heartBuf.toString('latin1'));
console.log('Star as latin1:', starBuf.toString('latin1'));
