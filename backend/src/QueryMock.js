const DynamoDB = require('aws-sdk/clients/dynamodb');
const dynamoDb = new DynamoDB.DocumentClient();

exports.handler = async function (event, context) {
	console.log(event.path);
	const item = await dynamoDb.get({
		TableName: process.env.TableName,
		Key: { Path: event.path.replace("/mock", ""), Method: event.httpMethod }
	}).promise();

	item.Item.Calls.push({
		Body: event.body,
		QueryParameters: event.queryStringParameters
	});

	await dynamoDb.put({
		TableName: process.env.TableName,
		Item: item.Item
	}).promise();

	const response = item.Item.Response;
	const status = item.Item.Status;
	const duration = item.Item.Duration;
	const body = item.Item.Raw ? response : JSON.stringify(response);
	const headers = {};
	if(item.Item.Headers) {
		for(let i = 0; i<item.Item.Headers.length; i++){
			const header = item.Item.Headers[i];
			headers[header.Key] = header.Value;
		}
	}

	await sleep(duration);
	return {
		statusCode: status,
		body: body,
		headers
	}
};

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

