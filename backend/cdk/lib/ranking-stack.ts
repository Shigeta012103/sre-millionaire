import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_dynamodb as dynamodb,
  aws_lambda as lambda,
} from "aws-cdk-lib";

export class RankingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const scoresTable = new dynamodb.Table(this, "ScoresTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const rankingFunction = new lambda.Function(this, "RankingFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda")),
      environment: { TABLE_NAME: scoresTable.tableName },
      timeout: cdk.Duration.seconds(10),
    });

    scoresTable.grantReadWriteData(rankingFunction);

    const functionUrl = rankingFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"],
        allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST],
        allowedHeaders: ["content-type"],
      },
    });

    new cdk.CfnOutput(this, "RankingApiUrl", { value: functionUrl.url });
  }
}
