module.exports = function auth(instance, callback) {
    const rl       = require('readline-sync'),
          Mastodon = require('./node_modules/mastodon-api/lib/mastodon.js'),
          fs       = require('fs');
    
    let clientId;
    let clientSecret;

    var baseUrl;
    var domain = rl.question('Please enter the domain of ' + instance + ' instance:');
    if(domain.indexOf('https://') == -1) {
        baseUrl = 'https://' + domain;
    } else {
        baseUrl = domain;
        domain = domain.split('/')[1];
    }

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
        return rl.question('Please enter the code from the website: ');
    })
    .then(code => Mastodon.getAccessToken(clientId, clientSecret, code, baseUrl))
    .catch(err => console.error(err))
    .then(accessToken => {
        console.log(`This is the access token. \n${accessToken}\nSaved as access_token.`);
        callback(null, {
            domain: domain,
            access_token: accessToken
        });
    });
}