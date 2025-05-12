const jwt = require('jsonwebtoken');
// const path = require('path');
// const fs = require('fs');

 
const getPublicKey = () => {
  try {
    return readFileSync('./sdk/public_key.pem', 'utf8');
  } catch (err) {
    console.error('Erro ao ler chave pública:', err);
    throw new Error('Chave pública não encontrada');
  }
};

const validateToken = (token) => {
  const publicKey = getPublicKey();

  try {

    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    return {
      valid: true,
      decoded: decoded,
    };
  } catch (err) {
    console.error('Erro ao validar token:', err);
    return {
      valid: false,
      error: err.message,
    };
  }
};

 
 
 
module.exports = {
  validateToken
};
