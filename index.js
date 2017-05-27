const fs = require('fs');
const Masto = require('mastodon');

const pref = JSON.parse(fs.readFileSync('./pref.json', 'utf8'));
const interval_min = 3;
const status_limit = 5;

let targetM = new Masto({
    access_token: pref.target.access_token,
    timeout_ms: 60 * 1000,
    api_url: 'https://' + pref.target.domain + '/api/v1/',
});

let myM;
if( !pref.singlemode )
{
    myM = new Masto({
        access_token: pref.my.access_token,
        timeout_ms: 60 * 1000,
        api_url: 'https://' + pref.my.domain + '/api/v1/',
    });
} else
{
    myM = targetM;
}

setInterval(() => {
    targetM.get('timelines/public', {local:true,limit:status_limit})
        .then(res => {
            let statuses = res.data;
            statuses.forEach((status) => {
                myM.post('follows', {uri: status.account.username + '@' + pref.target.domain})
                    .then((err, data, res) => {
                        console.log(err);
                    });
            });
        });
}, interval_min * 60 * 1000);