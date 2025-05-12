const User = require('../models/user');

const generateTotpSecretPlaceholder = () => {
    const pseudoSecret = `TEMP_SECRET_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    return {
        base32: pseudoSecret,
        otpauth_url: `otpauth://totp/Auth_APP:user?secret=${pseudoSecret}&issuer=Auth_APP`
    };
};

const verifyTotpCodePlaceholder = (secret, token) => {
    return typeof token === 'string' && token.length === 6 && secret.startsWith('VALID_SECRET_FOR_CODE_');
};

const generateQrCodeDataUrlPlaceholder = async (otpauthUrl) => `data:image/png;base64,${Buffer.from(`QR_CODE_FOR:${otpauthUrl}`).toString('base64')}`;


const getMfaConfiguration = async (userId) => {
    const user = await User.findById(userId).select('mfaEnabled emailMfaEnabled totpMfaEnabled email').lean();
    if (!user) throw new Error('Usuário não encontrado.');

    return {
        mfaEnabled: user.mfaEnabled || false,
        emailMfaEnabled: user.emailMfaEnabled || false,
        totpMfaEnabled: user.totpMfaEnabled || false,
        email: user.email
    };
};

const initiateTotpSetup = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    const { base32: tempSecret, otpauth_url } = generateTotpSecretPlaceholder();
    const qrCodeDataURL = await generateQrCodeDataUrlPlaceholder(otpauth_url);

    return {
        message: 'Escaneie o QR code com seu app autenticador e insira o código gerado.',
        tempSecret,
        qrCodeDataURL,
        otpauthUrl: otpauth_url
    };
};

const verifyAndEnableTotp = async (userId, totpCode, tempSecretProvidedByClient) => {
    if (!totpCode || !tempSecretProvidedByClient) throw new Error('Código TOTP e segredo temporário são obrigatórios.');

    const user = await User.findById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    const isValid = verifyTotpCodePlaceholder(tempSecretProvidedByClient, totpCode);

    if (!isValid) throw new Error('Código TOTP inválido. Tente novamente.');

    user.totpSecret = tempSecretProvidedByClient;
    user.totpMfaEnabled = true;
    user.mfaEnabled = true;

    await user.save();

    return { message: 'MFA com TOTP configurado com sucesso!' };
};

const enableEmailMfa = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    if (!user.email) throw new Error('Nenhum email configurado para este usuário. Atualize seu perfil.');

    user.emailMfaEnabled = true;
    user.mfaEnabled = true; 
    await user.save();

  
    return { message: 'MFA com Email configurado com sucesso!' };
};

const disableMfaMethod = async (userId, method) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    let message = '';
    if (method === 'totp') {
        if (!user.totpMfaEnabled) throw new Error('MFA com TOTP não está habilitado.');
        user.totpMfaEnabled = false;
        user.totpSecret = undefined;
        message = 'MFA com TOTP desabilitado.';
    } else if (method === 'email') {
        if (!user.emailMfaEnabled) throw new Error('MFA com Email não está habilitado.');
        user.emailMfaEnabled = false;
        message = 'MFA com Email desabilitado.';
    } else {
        throw new Error('Método MFA inválido.');
    }

    if (!user.totpMfaEnabled && !user.emailMfaEnabled) {
        user.mfaEnabled = false;
    }
    await user.save();
    return { message };
};

module.exports = {
    getMfaConfiguration,
    initiateTotpSetup,
    verifyAndEnableTotp,
    enableEmailMfa,
    disableMfaMethod,
};