const program = require("commander");
const AWS = require("aws-sdk");
const auth = require("../shared/auth-helper");
const Lambda = require('aws-sdk/clients/lambda');
const CloudFormation = require('aws-sdk/clients/cloudformation');
const ApiGateway = require('aws-sdk/clients/apigateway');

program
	.command("set-mock-url")
	.alias("s")
	.option("-s, --stack-name [stackName]", "Stack name", process.env.TEST_STACK_NAME)
	.option("-m, --mock-stack-name [mockStackName]", "The name of the serverless-testing stack", "serverless-testing")
	.option("-u, --base-url-env-vars [baseUrlEnvVars]", "The comma separated name(s) of the envrionment variables used by the implementing function to hold the base URL for the outgoing requests that should be mocked", "ApiBaseUrl,ApiGatewayBaseUrl")
	.option("-p, --profile [profile]", "AWS profile to use")
	.option(
		"--region [region]",
		"The AWS region to use.",
		AWS.config.region || process.env.AWS_REGION
	)
	.description("Gets the API Gateway URL for the http-mock stack and updates the ephemeral stack's Lambda functions with it")
	.action(async (cmd) => {
		await auth.initAuth(cmd);
		const lambda = new Lambda();
		const cloudformation = new CloudFormation();

		const stackName = cmd.stackName;
		const mockStackName = cmd.mockStackName;
		const baseUrl = await apiGatewayUrl(mockStackName);
		const functions = [];
		let token;
		do {
			const resources = await cloudformation.listStackResources({ StackName: stackName, NextToken: token }).promise();
			functions.push(...resources.StackResourceSummaries.filter(p => p.ResourceType === "AWS::Lambda::Function").map(p => p.PhysicalResourceId));
			token = resources.NextToken;
		} while (token);
		for (const functionName of functions) {
			const config = await lambda.getFunctionConfiguration({ FunctionName: functionName }).promise();
			config.Environment = config.Environment || { Variables: {} };
			for (const envVar of cmd.baseUrlEnvVars.split(",").map(p => p.trim())) {
				config.Environment.Variables[envVar] = `${baseUrl}/mock/${stackName}`;
			}
			await lambda.updateFunctionConfiguration({
				FunctionName: functionName,
				Environment: config.Environment
			}).promise();
		}
		console.log(baseUrl);
	});


async function apiGatewayUrl(stackName) {
	const apiGateway = new ApiGateway();

	let token;
	do {
		const response = await apiGateway.getRestApis({ limit: 500, position: token }).promise();
		const api = response.items.find(item => item.name === stackName);
		if (api) {
			return `https://${api.id}.execute-api.${AWS.config.region}.amazonaws.com/Prod`;
		}
		token = response.position;
	} while (token);
	return "ssss";
}

