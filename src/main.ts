import * as core from "@actions/core";
import * as http from "@actions/http-client";
import { StatusCodes } from "http-status-codes";

export async function run(): Promise<void> {
  // parameters

  const auth = core.getInput("auth").trim();
  const endpoint = core.getInput("endpoint").trim();
  const payload = JSON.parse(core.getInput("payload").trim());

  // validations

  let url = URL.parse(
    `https://api.kessokuteatime.work/${endpoint.replace(/^\//, "")}`
  );
  if (!url) throw new Error(`Invalid endpoint provided: ${endpoint}`);
  if (!payload) throw new Error(`Invalid JSON payload provided: ${payload}`);

  // actions

  const client = new http.HttpClient("kessoku-private-ci");
  const headers = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
    "User-Agent": "kessoku-private-ci",
  };
  const body = JSON.stringify(payload);

  core.info(`Posting a request to ${endpoint} with payload ${body}…`);
  await client
    .post(url.toString(), body, headers)
    .then(async (response: http.HttpClientResponse) => {
      const statusCode: StatusCodes | undefined = response.message.statusCode;
      const responseBody = await response.readBody();
      if (statusCode) {
        if (statusCode >= 200 && statusCode < 300) {
          core.info(
            `Successfully posted request to ${endpoint}: ${statusCode} ${response.message.statusMessage}`
          );
        } else {
          core.setFailed(
            `Failed to post request to ${endpoint}: ${statusCode} ${response.message.statusMessage} Body: ${responseBody}`
          );
        }
      } else {
        core.setFailed(
          `Failed to post request to ${endpoint}: No response from server`
        );
      }

      core.info(responseBody);
    });

  client.dispose();
}
