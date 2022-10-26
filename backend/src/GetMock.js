const DynamoDB = require('aws-sdk/clients/dynamodb');
const dynamoDb = new DynamoDB.DocumentClient();

exports.handler = async function (event, context) {
	console.log(event.path);
    console.log(event.httpMethod);
	const item = await dynamoDb.get({
		TableName: process.env.TableName,
		Key: { Path: event.path, Method: event.httpMethod }
	}).promise();

    return {
		statusCode: 200,
		body: JSON.stringify(item.Item),
	}
};
