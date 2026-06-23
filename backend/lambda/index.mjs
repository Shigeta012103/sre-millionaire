import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";

const TABLE_NAME = process.env.TABLE_NAME;
const MAX_ITEMS = 50;
const MAX_NAME_LENGTH = 20;
const MAX_CORRECT = 100;
const MAX_TIME_SEC = 100000;

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

function clampInt(value, min, max) {
  const num = Math.floor(Number(value));
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

async function getRanking() {
  const result = await client.send(new ScanCommand({ TableName: TABLE_NAME }));
  const items = (result.Items ?? [])
    .map((item) => ({
      name: item.name,
      correct: item.correct,
      time: item.time,
      ts: item.ts,
    }))
    .sort((a, b) => b.correct - a.correct || a.time - b.time || a.ts - b.ts)
    .slice(0, MAX_ITEMS);
  return jsonResponse(200, { items });
}

async function postScore(rawBody) {
  const data = JSON.parse(rawBody ?? "{}");
  const name = String(data.name ?? "").trim().slice(0, MAX_NAME_LENGTH) || "挑戦者";
  const correct = clampInt(data.correct, 0, MAX_CORRECT);
  const time = clampInt(data.time, 0, MAX_TIME_SEC);
  await client.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { id: randomUUID(), name, correct, time, ts: Date.now() },
    })
  );
  return jsonResponse(201, { ok: true });
}

export const handler = async (event) => {
  const method = event?.requestContext?.http?.method ?? "GET";
  try {
    if (method === "GET") return await getRanking();
    if (method === "POST") return await postScore(event.body);
    return jsonResponse(405, { message: "Method Not Allowed" });
  } catch (error) {
    console.error(error);
    return jsonResponse(500, { message: "Internal Server Error" });
  }
};
