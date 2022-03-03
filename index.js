import fetch from 'node-fetch';
import 'dotenv/config';

// get token
getToken(null, (error, token) => {
    if (error) {
        console.log(error);
    } else {
        console.log(token);
    }
});

/**
 * Starts a new OAuth2 session and returns the access token.
 */
function getToken(data, callback) {
    var authorization = "Bearer ";
    console.log(`Logging in as ${process.env.MSP_USERNAME}...\n`);

    //Get refresh token to generate access token
    fetch("https://eu.mspapis.com/loginidentity/connect/token", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-GB,en;q=0.9,en-US;q=0.8,sv;q=0.7",
                "content-type": "application/x-www-form-urlencoded",
                "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Microsoft Edge\";v=\"92\"",
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site"
            },
            "referrer": `https://moviestarplanet2.${process.env.MSP_SERVER.toLocaleUpperCase()}/`,
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": `client_id=unity.client&client_secret=secret&grant_type=password&scope=openid%20nebula%20offline_access&username=${process.env.MSP_SERVER}%7c${process.env.MSP_USERNAME}&password=${process.env.MSP_PASSWORD}&acr_values=gameId%3aj68d`,
            "method": "POST",
            "mode": "cors"
        }).then(res => res.json())
        .then(loginIdentity => {

            // Check if login was successful
            if (loginIdentity.error)
            {
                callback(loginIdentity.error_description, null);
                throw new Error(`${loginIdentity.error} - ${loginIdentity.error_description}`);
            }

            console.log(`Success! Logged in as ${process.env.MSP_USERNAME}. Authorizing...\n`)

            //Get the final access token from the refresh token, and use it to make requests
            fetch("https://eu.mspapis.com/loginidentity/connect/token", {
                    "headers": {
                        "accept": "*/*",
                        "accept-language": "en-GB,en;q=0.9",
                        "authorization": "Basic dW5pdHkuY2xpZW50OnNlY3JldA==",
                        "content-type": "application/x-www-form-urlencoded",
                        "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Microsoft Edge\";v=\"92\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "cross-site"
                    },
                    "referrer": `https://moviestarplanet2.${process.env.MSP_SERVER.toLocaleUpperCase()}/`,
                    "referrerPolicy": "strict-origin-when-cross-origin",
                    "body": `grant_type=refresh_token&refresh_token=${loginIdentity.refresh_token}&acr_values=gameId%3aj68d%20profileId%3a${process.env.MSP_ID}`,
                    "method": "POST",
                    "mode": "cors"
                }).then(res => res.json())
                .then(fullIdentity => {
                    authorization += fullIdentity.access_token;

                    console.log(`Authorized as ${process.env.MSP_USERNAME}\n`);

                    callback("", authorization);
                });
        });
}