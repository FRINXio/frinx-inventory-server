import fetch, { RequestInit } from 'node-fetch';
import join from 'url-join';
import APIError from '../errors/api-error';
import { HttpStatusCode } from '../errors/base-error';
import getLogger from '../get-logger';

const log = getLogger('inventory-server:fetch');

// TODO: move to .env
const UNICONFIG_API = 'http://10.19.0.7/api/uniconfig';

let currentRequestId = 0;

function makeRequestId(): string {
  currentRequestId += 1;
  // to keep the number to normal values.
  // hopefully it will not cause problems
  if (currentRequestId > 10000) {
    currentRequestId = 1;
  }

  return currentRequestId.toString();
}

const TEXT_LIMIT = 40;

function shortenString(text: string): string {
  if (text.length < TEXT_LIMIT + 5) {
    return text;
  }

  return `${text.slice(0, 30)}...SHORTENED...`;
}

function bigObjectToSmallString(obj: unknown) {
  return JSON.stringify(obj, (key, value) => (typeof value === 'string' ? shortenString(value) : value), 4);
}

function logRequest(requestId: string, url: string, options: RequestInit) {
  log.info(`request(${requestId}): ${url}: ${bigObjectToSmallString(options)}`);
}

function logError(requestId: string, code: number) {
  log.info(`request(${requestId}) failed with http-code: ${code}`);
}

function logResponse(requestId: string, data: unknown) {
  log.info(`response(${requestId}): ${bigObjectToSmallString(data)}`);
}

async function apiFetch(path: string, options: RequestInit): Promise<unknown> {
  const requestId = makeRequestId();
  const url = join(UNICONFIG_API, path);
  logRequest(requestId, url, options);
  const response = await fetch(url, options);

  if (!response.ok) {
    logError(requestId, response.status);
    // throw new Error(`apiFetch failed with http-code ${response.status}`);
    throw new APIError(response.status.toString(), HttpStatusCode.INTERNAL_SERVER, true, JSON.stringify(response));
  }

  if (response.status === 201 || response.status === 204) {
    return response;
  }

  const json = await response.json();
  logResponse(requestId, json);

  return json;
}
export async function sendPostRequest(path: string, body?: unknown): Promise<unknown> {
  const options = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      authorization: 'Basic YWRtaW46YWRtaW4=',
    },
  };
  return apiFetch(path, options);
}
