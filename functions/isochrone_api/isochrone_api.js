const fetch = require("node-fetch");

const key = process.env.API_SECRET_BING;

exports.handler = async (event, context) => {
    try {
        if (event.httpMethod !== "GET") {
            return {statusCode: 405, body: "Method Not Allowed"};
        }

        const lat = event.queryStringParameters.lat;
        const lng = event.queryStringParameters.lng;
        if (!lat || !lng) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message:
                        "Los parámetros de lat y lng deben existir y ser correctos",
                }),
            };
        }
        const url = `https://dev.virtualearth.net/REST/v1/Routes/Isochrones?waypoint=${lat},${lng}&maxDistance=1&travelMode=walking&optimize=distance&key=${key}`;

        return fetch(url, {headers: {Accept: "application/json"}})
            .then(response => {
                console.log(response);
                return response.json();
            })
            .then(data => ({
                statusCode: 200,
                body: JSON.stringify(
                    data.resourceSets[0].resources[0].polygons[0].coordinates
                ),
            }))
            .catch(error => ({statusCode: 422, body: String(error)}));
    } catch (err) {
        return {statusCode: 500, body: err.toString()};
    }
};
