const jwt = require('jsonwebtoken');
 
// const privateKey = `-----BEGIN PRIVATE KEY-----

// -----END PRIVATE KEY-----`

const privateKey  =  process.env.PRIVATE_KEY
 
const generateToken = (user) => {
    return jwt.sign(
      { id: user._id, role: user.role }, 
      privateKey,  
      { algorithm: 'RS256', expiresIn: process.env.EXPIRES_TOKEN_IN  } 
    );
  };


module.exports = { generateToken, privateKey };