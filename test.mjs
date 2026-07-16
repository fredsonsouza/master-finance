import jwt from 'jsonwebtoken'

async function run() {
  const token = jwt.sign(
    { sub: 'b71ea2ef-4c55-401b-9373-384143ea25a1' },
    'my-jwt-secret'
  ) // I don't know the exact user ID, but we can query one from DB or just hit the API and see if it fails auth or the database query. Wait, if user ID doesn't exist, it returns 401 Unauthorized, not 500.

  const res = await fetch(
    'http://localhost:3131/collections?unitId=012dc176-cd96-47ff-a40b-c1edf9e529c6',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  const text = await res.text()
  console.log(res.status, text)
}

run()
