const program = require("commander");
const { execSync } = require("child_process");

program
.command("get-stack-name")
.alias("g")
.description("Generates an ephemeral stack name for the current git branch")
.action(async () => {
	const repoName = execSync("git config --get remote.origin.url").toString().split("/").pop().split(".git").shift();
	const branchName = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
	console.log(`${repoName}-${branchName}`.replace("/", "-"));
});
