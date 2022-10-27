const DynamoDB = require('aws-sdk/clients/dynamodb');
const dynamoDb = new DynamoDB.DocumentClient();

const tenMinutes = 10 * 60;
exports.handler = async function (event, context) {
	const body = JSON.parse(event.body);
	await dynamoDb.put({
		TableName: process.env.TableName,
		Item: {
			...body,
			Path: event.path.replace("/setup", ""),
			Calls: [],
			TTL: new Date().getTime() / 1000 + tenMinutes
		}
	}).promise();

	return {
		statusCode: 200,
		body: "ok"
	}
}