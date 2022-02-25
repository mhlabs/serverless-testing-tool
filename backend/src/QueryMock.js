const DynamoDB = require('aws-sdk/clients/dynamodb');
const dynamoDb = new DynamoDB.DocumentClient();

exports.handler = async function (event, context) {
	console.log(event.path);
	const item = await dynamoDb.get({
		TableName: process.env.TableName,
		Key: { Path: event.path.replace("/mock", ""), Method: event.httpMethod }
	}).promise();

	const response = item.Item.Response;
	const status = item.Item.Status;
	const duration = item.Item.Duration;
	await sleep(duration);
	return {
		statusCode: status,
		body: JSON.stringify(response),
	}
};

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

