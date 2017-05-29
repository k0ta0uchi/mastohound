const fs = require('fs');
const Masto = require('mastodon');

// get prefs from pref.json. (use pref.template.json as a template)
// first, use auth.js to get instances' access_tokens.
const pref = JSON.parse(fs.readFileSync('./pref.json', 'utf8'));

const INTERVAL_MIN = 1;         // interval for following.
const STATUS_LIMIT = 10;         // number of statuses to process at once.
const FOLLOWINGS_LIMIT = 80;    // number of following limit when retrieving accounts.

// target instance to follow
let targetM = new Masto({
    access_token: pref.target.access_token,
    timeout_ms: 60 * 1000,
    api_url: 'https://' + pref.target.domain + '/api/v1/',
});

// following account
let myM;
// if single mode, use target account as following account
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

// get account's id to follow.
myM.get('accounts/verify_credentials',{})
.then(res => {
    getFollowings(res.data.id, []);
});

/**
 * get all following accounts and put into an array.
 * @param {number} id      // account's id to follow.
 * @param {array} accounts // following accounts.
 * @param {number} max_id  // next page's max_id. (option)
 */
var getFollowings = (id, accounts, max_id) => {
    console.log('max_id: '+ max_id);

    if(max_id == undefined)
    {
        max_id = '';
    }
    // get following accounts by page
    myM.get('accounts/' + id + '/following',{
        max_id: max_id,
        limit: FOLLOWINGS_LIMIT
    })
    .then(res => {
        accounts = accounts.concat(res.data);

        // scrape next page's max_id.
        /.*?max_id=(\d*)?>/.exec(res.resp.headers.link);
        var _max_id = RegExp.$1;

        // if max_id available, process getFollowings recursively.
        if(_max_id != 'https:')
        {
            getFollowings(id, accounts, _max_id);
        }
        else
        {
            console.log("Total accounts: " + accounts.length);

            // if all accounts obtained, proceed to next step, following accounts.
            followAccounts(accounts);
        }
    });
};

/**
 * follow accounts not being followed.
 * @param {array} accounts 
 */
var followAccounts = (accounts) => {
    // set an interval to avoid being DDOS like.
    setInterval(() => {
        console.log('Awooooooooo!!!');

        targetM.get('timelines/public', {local:true,limit:STATUS_LIMIT})
        .then(res => {
            let statuses = res.data;

            statuses.forEach((status) => {
                // search if already followed or not.
                if(!searchFollowing(accounts, status.account))
                {
                    accounts.push(status.account);

                    // follow account
                    myM.post('follows', {uri: status.account.username + '@' + pref.target.domain})
                    .then((res) => {
                        if(!res.data.error)
                        {
                            console.log("Followed: " + res.data.username);
                        }
                    });
                }
            });
        });
    }, INTERVAL_MIN * 60 * 1000);
};

/**
 * search account already followed
 * @param {array} accounts 
 * @param {object} account 
 */
var searchFollowing = (accounts, account) => {
    
    var found = false;
    accounts.some((_account) => {
        if(_account.url == account.url)
        {
            found = true;
            return true;
        }
    });
    return found;
};