const EventBridge = require("aws-sdk/clients/eventbridge")
const Sqs = require("aws-sdk/clients/sqs");
const Sts = require("aws-sdk/clients/sts");
const eventbridge = new EventBridge();
const sqs = new Sqs();
const sts = new Sts();
const resources = {};

async function subscribe(eventbus, pattern, name) {
	name = name || new Date().getTime().toString();
	const identity = await sts.getCallerIdentity().promise();
	const ruleName = `${process.env.TEST_STACK_NAME}-ephemeral-${name}`;
	const sqsArn = `arn:aws:sqs:eu-west-1:${identity.Account}:${ruleName}`;
	const queue = await sqs.createQueue({
		QueueName: ruleName,
	}).promise();

	console.log("Waiting for queue to get ready...");
	await eventbridge.putRule({ Name: ruleName, EventBusName: eventbus, EventPattern: JSON.stringify(pattern) }).promise();
	await eventbridge.putTargets({ Rule: ruleName, Targets: [{ Id: name, Arn: sqsArn }], EventBusName: eventbus }).promise();
	const rule = await eventbridge.describeRule({ Name: ruleName, EventBusName: eventbus }).promise();
	console.log("Rule", JSON.stringify(rule, null, 2));
	console.log("Waiting for rule to get ready...");
	await new Promise((r) => setTimeout(r, 2000));

	const policy = {
		Version: "2012-10-17",
		Id: sqsArn + "/SQSDefaultPolicy",
		Statement: [
			{
				Sid: `Sid${new Date().getTime()}`,
				Effect: "Allow",
				Principal: {
					Service: "events.amazonaws.com",
				},
				Action: "sqs:SendMessage",
				Resource: sqsArn
			}
		]
	};
	await sqs
		.setQueueAttributes({
			Attributes: {
				Policy: JSON.stringify(policy),
			},
			QueueUrl: queue.QueueUrl,
		})
		.promise();
	resources[queue.QueueUrl] = [
		async () => {
			console.log("deleting target")
			await eventbridge.removeTargets({ Rule: ruleName, Ids: [name], EventBusName: eventbus }).promise();
		},
		async () => {
			console.log("deleting rule")
			await eventbridge.deleteRule({ Name: ruleName, EventBusName: eventbus }).promise();
		},
		async () => {
			console.log("deleting queue")
			await sqs.deleteQueue({ QueueUrl: queue.QueueUrl }).promise();
		},
	]

	return queue.QueueUrl;
}

async function waitForEvent(queueUrl, timeout = 20) {
	var params = {
		MaxNumberOfMessages: 1,
		QueueUrl: queueUrl,
		WaitTimeSeconds: timeout
	};
	let messages;
	do {
		console.log("Waiting for messages...");
		messages = await sqs.receiveMessage(params).promise();
	} while (!messages.Messages);

	return messages.Messages && messages.Messages.length ? JSON.parse(messages.Messages[0].Body) : null;
}

async function cleanUp(key = null) {
	for (let [key, value] of Object.entries(resources)) {
		for (let cleanup of value) {
			if (key === null || key === key) {
				await cleanup();
			}
		}
	}
}

module.exports = {
	subscribe,
	waitForEvent,
	cleanUp
}