const axios = require("axios").default;
const AWS = require("aws-sdk");
const ApiGateway = require("aws-sdk/clients/apigateway");
const apiGateway = new ApiGateway();

const { aws4Interceptor } = require("aws4-axios");
const interceptor = aws4Interceptor({
	region: AWS.config.region,
	service: "execute-api",
});
axios.interceptors.request.use(interceptor);

async function mock(config) {
    console.log(`${process.env.HTTP_MOCK_BASE_URL}/setup/${process.env.TEST_STACK_NAME}${config.uri}`)
	await axios.put(`${process.env.HTTP_MOCK_BASE_URL}/setup/${process.env.TEST_STACK_NAME}${config.uri}`, { 
		Response: config.response, 
		Duration: config.duration || 0, 
		Status: config.status || 200, 
		Method: config.method.toUpperCase() || "GET"
	 });
}

async function makeRequest(method, uri, data) {
	const url = await apiGatewayUrl() + uri;
	console.log("URL=", url);
	await axios[method.toLowerCase()](url, data);
}

async function apiGatewayUrl(stackName = process.env.TEST_STACK_NAME) {
	let token;
	do {
		const response = await apiGateway.getRestApis({ limit: 500, position: token }).promise();
		const api = response.items.find(item => item.name === stackName);
        console.log("teeest", stackName, api);
		if (api) {
			return `https://${api.id}.execute-api.eu-west-1.amazonaws.com/Prod`;
		}
		token = response.position;
	} while (token);
	return null;
}

module.exports = {
	mock,
	makeRequest,
	apiGatewayUrl
}