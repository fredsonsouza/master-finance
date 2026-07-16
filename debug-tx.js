const http = require('node:http')

const req = http.request(
  {
    hostname: 'localhost',
    port: 3131,
    path: '/transactions',
    method: 'GET',
  },
  (res) => {
    let data = ''
    res.on('data', (chunk) => (data += chunk))
    res.on('end', () => {
      if (res.statusCode !== 200) {
        console.log('Error:', res.statusCode, data)
        return
      }
      const json = JSON.parse(data)
      console.log(JSON.stringify(json.transactions[0].item, null, 2))
    })
  }
)
req.end()
