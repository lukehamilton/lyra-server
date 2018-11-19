const jwksClient = require('jwks-rsa')
const jwt = require('jsonwebtoken')
const jwks = jwksClient({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 1,
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
})

const validateAndParseIdToken = (idToken) => new Promise((resolve, reject) => {
  // console.log('process.env', process.env)
  console.log('process.env.AUTH0_DOMAIN', process.env.AUTH0_DOMAIN)
  const { header, payload} = jwt.decode(idToken, {complete: true})
  if (!header || !header.kid || !payload) reject(new Error('Invalid Token'))
  console.log('jwks', jwks)
  jwks.getSigningKey(header.kid, (err, key) => {
    // console.log('err', err)
    // console.log('key', key)
    if (err) reject(new Error('Error getting signing key: ' + err.message))
    jwt.verify(idToken, key.publicKey, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) reject('jwt verify error: ' + err.message)
      resolve(decoded)
    })
  })
})

module.exports = validateAndParseIdToken