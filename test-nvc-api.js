const fetch = require('node-fetch');

const url = 'http://localhost:5001/api/nvc';
const body = { text: 'I feel very sad' };

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})
  .then(res => res.json())
  .then(data => {
    console.log('API response:', data);
  })
  .catch(err => {
    console.error('Error:', err);
  });
