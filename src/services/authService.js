const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { generateToken } = require('../config/jwt');


const sendUserEmailMfaCode = async (user) => {
  if (!user.email) {
    console.error(`O usuário ${user.username} não possui segredo TOTP configurado.`);
    throw new Error('Email não configurado para MFA.');
  }
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  user.pendingEmailMfaCode = code;
  user.pendingEmailMfaCodeExpires = expires;

  return { code, expires };
};


const verifyUserEmailMfaCode = async (user, code) => {
  if (
    user.pendingEmailMfaCode &&
    user.pendingEmailMfaCode === code &&
    user.pendingEmailMfaCodeExpires &&
    new Date() < new Date(user.pendingEmailMfaCodeExpires)
  ) {
    user.pendingEmailMfaCode = null;
    return true;
  }
  return false;
};


const verifyUserTotpMfaCode = async (user, code) => {
  if (!user.totpSecret) {
    console.warn(`O usuário ${user.username} não possui o segredo TOTP configurado.`);
    return false;
  }

  return typeof code === 'string' && code.length === 6 && user.totpSecret.startsWith(process.env.TOTP_SECRET_PREFIX);
};


const login = async (username, password, mfaDetails = {}) => {
  const user = await User.findOne({ username }).lean();  
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Credenciais inválidas');
  }

  if (user.mfaEnabled) {
    const { code: mfaCode, method: mfaMethod } = mfaDetails;

    if (mfaCode && mfaMethod) {
      let isValidMfa = false;
      if (mfaMethod === 'email' && user.emailMfaEnabled) {
        isValidMfa = await verifyUserEmailMfaCode(user, mfaCode); 
        if (!isValidMfa) throw new Error('Código MFA de Email inválido ou expirado');
      } else if (mfaMethod === 'totp' && user.totpMfaEnabled) {
        isValidMfa = await verifyUserTotpMfaCode(user, mfaCode);
        if (!isValidMfa) throw new Error('Código TOTP inválido');
      } else {
        throw new Error(`Método MFA '${mfaMethod}' não suportado ou não habilitado para este usuário.`);
      }

    } else {
      const availableMethods = [];
      if (user.emailMfaEnabled) availableMethods.push('email');
      if (user.totpMfaEnabled) availableMethods.push('totp');

      if (availableMethods.length === 0) {
        throw new Error('Erro de configuração MFA. Contate o suporte.');
      }

      const error = new Error('Autenticação de Múltiplos Fatores Obrigatória');
      error.mfaRequired = true;
      error.mfaMethodsAvailable = availableMethods;  

      if (availableMethods.includes('email') && mfaMethod !== 'email') {
        try {
          await sendUserEmailMfaCode(user);

          error.message = `Código MFA enviado para seu email. ${error.message}`;
        } catch (emailError) {
          console.error(`Falha ao enviar email MFA para ${user.username}:`, emailError.message);
        }
      }
      throw error;
    }
  }

  const token = generateToken({ _id: user._id, username: user.username });  
  return token;
};

module.exports = { login };