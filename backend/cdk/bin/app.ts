#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { RankingStack } from "../lib/ranking-stack";

const app = new cdk.App();

new RankingStack(app, "SreMillionaireRankingStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
