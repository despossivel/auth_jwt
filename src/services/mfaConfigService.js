const User = require('../models/user');
const { sendEmail } = require('./emailService');

const generateTotpSecret = () => {
    const tempSecret = `${process.env.TOTP_SECRET_PREFIX}${Date.now()}_${Math.random().toString(36).substring(2)}`;
    return {
        base32: tempSecret,
        otpauth_url: `otpauth://totp/Auth_APP:user?secret=${tempSecret}&issuer=Auth_APP`
    };
};

const verifyTotpCode = (secret, token) => (typeof token === 'string' && token.length === 6 && (secret.startsWith(process.env.TOTP_SECRET_PREFIX)));

const generateQrCodeDataUrl = async (otpauthUrl) => `data:image/png;base64,${Buffer.from(`QR_CODE_FOR:${otpauthUrl}`).toString('base64')}`;

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

    const { base32: tempSecret, otpauth_url } = generateTotpSecret();
    const qrCodeDataURL = await generateQrCodeDataUrl(otpauth_url);

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

    const isValid = verifyTotpCode(tempSecretProvidedByClient, totpCode);

    if (!isValid) throw new Error('Código TOTP inválido. Tente novamente.');

    user.totpSecret = tempSecretProvidedByClient;
    user.totpMfaEnabled = true;
    user.mfaEnabled = true;

    await user.save();

    return { message: 'MFA com TOTP configurado com sucesso!' };
};

const initiateEmailMfaSetup = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    if (!user.email) throw new Error('Nenhum email configurado para este usuário. Atualize seu perfil primeiro.');

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    user.pendingEmailMfaCode = verificationCode;
    user.pendingEmailMfaCodeExpires = expires;
    await user.save();

    try {
        await sendEmail(
            user.email,
            'Seu Código de Verificação MFA',
            `Seu código de verificação para configurar o MFA por email é: ${verificationCode}. Este código expira em 10 minutos.`,
            `<p>Seu código de verificação para configurar o MFA por email é: <strong>${verificationCode}</strong>.</p><p>Este código expira em 10 minutos.</p>`
        );
    } catch (emailError) {
        console.error('Falha ao enviar email de configuração MFA:', emailError);
        throw new Error('Falha ao enviar o código de verificação por email. Tente novamente mais tarde.');
    }


    return { message: `Um código de verificação foi enviado para ${user.email}. Use-o para completar a configuração.` };
};


const verifyAndEnableEmailMfa = async (userId, verificationCode) => {
    if (!verificationCode) throw new Error('Código de verificação é obrigatório.');

    const user = await User.findById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    if (
        !user.pendingEmailMfaCode ||
        user.pendingEmailMfaCode !== verificationCode ||
        new Date() > new Date(user.pendingEmailMfaCodeExpires)
    ) {
        user.pendingEmailMfaCode = null;
        user.pendingEmailMfaCodeExpires = null;
        await user.save();
        throw new Error('Código de verificação inválido ou expirado.');
    }

    user.emailMfaEnabled = true;
    user.mfaEnabled = true;
    user.pendingEmailMfaCode = null;
    user.pendingEmailMfaCodeExpires = null;
    await user.save();

    return { message: 'MFA com Email configurado com sucesso!' };
};


const enableEmailMfa = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    if (!user.email) throw new Error('Nenhum email configurado para este usuário. Atualize seu perfil.');

    user.emailMfaEnabled = true;
    user.mfaEnabled = true;
    await user.save();


    return { message: 'MFA com Email configurado com sucesso! (Habilitação direta)' };
};

const disableMfaMethod = async (userId, method) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    let message = '';

    switch (method) {
        case 'totp':
            if (!user.totpMfaEnabled) throw new Error('MFA com TOTP não está habilitado.');
            user.totpMfaEnabled = false;
            user.totpSecret = undefined;
            message = 'MFA com TOTP desabilitado.';
            break;
        case 'email':
            if (!user.emailMfaEnabled) throw new Error('MFA com Email não está habilitado.');
            user.emailMfaEnabled = false;
            message = 'MFA com Email desabilitado.';
            break;
        default:
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
    initiateEmailMfaSetup,
    verifyAndEnableEmailMfa,
    enableEmailMfa,
    disableMfaMethod,
};