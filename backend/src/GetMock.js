const DynamoDB = require('aws-sdk/clients/dynamodb');
const dynamoDb = new DynamoDB.DocumentClient();

exports.handler = async function (event, context) {
	const item = await dynamoDb.get({
		TableName: process.env.TableName,
		Key: { Path: event.path, Method: event.queryStringParameters.httpMethod }
	}).promise();

    return {
		statusCode: 200,
		body: JSON.stringify(item.Item),
	}
};
