const readline = require('readline');
const Mastodon = require('./node_modules/mastodon-api/lib/mastodon.js');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let clientId;
let clientSecret;

const baseUrl = 'https://k0ta.net';

Mastodon.createOAuthApp(baseUrl + '/api/v1/apps', 'MastoHound', 'read write follow')
    .catch(err => console.error(err))
    .then((res) => {
        console.log('Please save \'id\', \'client_id\' and \'client_secret\' in your program and use it from now on!');
        console.log(res);

        clientId = res.client_id;
        clientSecret = res.client_secret;

        return Mastodon.getAuthorizationUrl(clientId, clientSecret, baseUrl);
    })
    .then(url => {
        console.log('This is the authorization URL. Open it in your browser and authorize with your account!');
        console.log(url);
        return new Promise((resolve) => {
            rl.question('Please enter the code from the website: ', code => {
                resolve(code);
                rl.close();
            })
        })
    })
    .then(code => Mastodon.getAccessToken(clientId, clientSecret, code, baseUrl))
    .catch(err => console.error(err))
    .then(accessToken => {
        console.log(`This is the access token. Save it!\n${accessToken}`);
    });
