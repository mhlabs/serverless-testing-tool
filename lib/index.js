#!/usr/bin/env node
process.env.AWS_SDK_LOAD_CONFIG = 1;
const program = require("commander");
const package = require("./package.json");

require("./commands/set-mock-url");
require("./commands/get-stack-name");
program.version(package.version, "-v, --vers", "output the current version");

program.parse(process.argv);

