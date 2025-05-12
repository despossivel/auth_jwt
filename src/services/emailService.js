const sendEmail = async (to, subject, text, html) => {
    console.log('--- SIMULATING EMAIL SEND ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${text}`);
    if (html) console.log(`HTML: ${html}`);
    console.log('--- END SIMULATING EMAIL SEND ---');

    return Promise.resolve();
};

module.exports = {
    sendEmail,
};