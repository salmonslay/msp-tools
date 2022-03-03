import fetch from 'node-fetch';
import cron from 'node-cron';
import 'dotenv/config';

getToken((error, identity) => {
    if (error) {
        console.error(error);
        return;
    }

    getUserInfo({
        access_token: identity.access_token,
    }, (error, userInfo) => {
        if (error) {
            console.error(`An error occurred while getting user info: ${error}`);
            return;
        }

        // Print the user's profile data.
        // userInfo.data is the raw JSON data.
        printProfileData(userInfo.data);

        // Try to give an autograph every 5 minutes.
        cron.schedule(process.env.MSP_AUTOGRAPH_CRON, () => {
            sendAutograph(identity);
        });
    });
});

/**
 * Starts a new OAuth2 session and returns the access token.
 * @param {callback} callback The callback function to call when the request is complete
 */
function getToken(callback) {
    console.log(`Logging in as ${process.env.MSP_USERNAME}...\n`);

    //Get refresh token to generate access token
    fetch("https://eu.mspapis.com/loginidentity/connect/token", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-GB,en;q=0.9,en-US;q=0.8,sv;q=0.7",
                "content-type": "application/x-www-form-urlencoded",
                "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"98\", \"Microsoft Edge\";v=\"98\"",
            },
            "body": `client_id=unity.client&client_secret=secret&grant_type=password&scope=openid%20nebula%20offline_access&username=${process.env.MSP_SERVER}%7c${process.env.MSP_USERNAME}&password=${process.env.MSP_PASSWORD}&acr_values=gameId%3aj68d`,
            "method": "POST",
            "mode": "cors"
        }).then(res => res.json())
        .then(loginIdentity => {

            // Check if login was successful
            if (loginIdentity.error) {
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
                        "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"98\", \"Microsoft Edge\";v=\"98\"",
                    },
                    "body": `grant_type=refresh_token&refresh_token=${loginIdentity.refresh_token}&acr_values=gameId%3aj68d%20profileId%3a${process.env.MSP_ID}`,
                    "method": "POST",
                    "mode": "cors"
                }).then(res => res.json())
                .then(fullIdentity => {
                    console.log(`Authorized as ${process.env.MSP_USERNAME}\n`);

                    callback(null, fullIdentity);
                });
        });
}

/**
 * Gets the user info from the access token.
 * @param {json} data The data to send to the endpoint
 * @param {callback} callback The callback function to call when the request is complete
 */
function getUserInfo(data, callback) {
    // Get user info with access token 
    fetch("https://eu.mspapis.com/edgeprofile/graphql/graphql", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-GB,en;q=0.9,en-US;q=0.8,sv;q=0.7",
                "authorization": "Bearer " + data.access_token,
                "content-type": "application/json",
                "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"98\", \"Microsoft Edge\";v=\"98\"",
            },

            // the body is copied from the network tab in devtools, it doesn't look very nice but their API is private
            "body": `{\"query\":\"\\r\\n            query getProfile($profileId: String!, $gameId:String!)\\r\\n            {\\r\\n               profile(profileId: $profileId) {\\r\\n                    name\\r\\n                \\r\\n                    attributes(gameId: $gameId) {\\r\\n                      additionalData {\\r\\n                        key\\r\\n                        value\\r\\n                      }\\r\\n                    }\\r\\n\\r\\n                    avatar(gameId: $gameId) {\\r\\n\\t\\t\\t\\t\\t  id\\r\\n                      full\\r\\n                      face\\r\\n                    }\\r\\n\\r\\n                    progression(gameId: $gameId) {\\r\\n                      values {\\r\\n                        name\\r\\n                        count\\r\\n                      }\\r\\n                    }    \\r\\n                    \\r\\n                    balance(gameId: $gameId) {\\r\\n                      available {\\r\\n                        currency\\r\\n                        count\\r\\n                      }\\r\\n                    }\\r\\n                    \\r\\n                    memberships {\\r\\n                      currentTierSecondsLeft\\r\\n                    }\\r\\n                }\\r\\n            }\",\"variables\":\"{\\\"profileId\\\":\\\"${process.env.MSP_ID}\\\",\\\"gameId\\\":\\\"j68d\\\"}\",\"operationName\":\"getProfile\"}`,
            "method": "POST"
        }).then(res => res.json())
        .then(profileData => {
            // Check if login was successful
            if (profileData.errors) {
                callback(profileData.errors[0].message, null);
                return;
            } else {
                callback(null, profileData);
            }
        });
}
/**
 * Tries to send an autograph to the user defined in the environment variables.
 * @param {json} data The token data
 */
function sendAutograph(data) {
    // Cancel if there is no user to send to
    if (!process.env.MSP_AUTOGRAPH_ID)
        return;

    // Send the autograph
    fetch(`https://eu.mspapis.com/profilegreetings/v1/profiles/${process.env.MSP_ID}/games/j68d/greetings`, {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-GB,en;q=0.9",
            "authorization": "Bearer " + data.access_token,
            "content-type": "application/json",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"98\", \"Microsoft Edge\";v=\"98\"",
        },
        "body": `{\"greetingType\":\"autograph\",\"receiverProfileId\":\"${process.env.MSP_AUTOGRAPH_ID}\",\"compatibilityMode\":\"Nebula\",\"useAltCost\":false}`,
        "method": "POST"
    }).then(res => res.json()
        .then(res => {
            console.log(`Sent an autograph. Result: ${res.result}`);
        }));
}

/**
 * An example of how to display and use the received data.
 * @param {json} data The MSP data to print out
 */
function printProfileData(profileData) {
    // Colors for the console
    const FgYellow = "\x1b[33m";
    const FgWhite = "\x1b[37m"
    console.log("User Info:")
    console.log("\tCharacter metadata:");
    console.log(FgYellow, `\t\tUsername:`, FgWhite, profileData.profile.name);
    console.log(FgYellow, `\t\tGender:`, FgWhite, profileData.profile.attributes.additionalData[1].value);

    console.log("\n\tCharacter avatar:");
    console.log(FgYellow, `\t\tAvatar Image:`, FgWhite, `https://ugc-eu.mspcdns.com/${profileData.profile.avatar.full}`);
    console.log(FgYellow, `\t\tFace Image:`, FgWhite, `https://ugc-eu.mspcdns.com/${profileData.profile.avatar.face}`);

    console.log(`\n\tCharacter progression:`);
    console.log(FgYellow, `\t\tFame:`, FgWhite, `${profileData.profile.progression.values[0].count} (level ${profileData.profile.progression.values[1].count})`);
    console.log(FgYellow, `\t\tStar Coins:`, FgWhite, `${profileData.profile.balance.available[0].count}\n`);
}