import fetch, { RequestInit } from 'node-fetch';
import join from 'url-join';
import https from 'https';
import APIError from '../errors/api-error';
import { HttpStatusCode } from '../errors/base-error';
import getLogger from '../get-logger';

const log = getLogger('inventory-server:fetch');

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

const TEXT_LIMIT = 200;

function shortenString(text: string): string {
  if (text.length < TEXT_LIMIT + 5) {
    return text;
  }

  return `${text.slice(0, 180)}...SHORTENED...`;
}

function bigObjectToSmallString(obj: unknown) {
  return shortenString(
    JSON.stringify(obj, (key, value) => (typeof value === 'string' ? shortenString(value) : value), 4),
  );
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

export type APIPath = string[];

function makeOptions(url: string, options: RequestInit): RequestInit {
  const isURLSecure = url.startsWith('https://');
  if (isURLSecure) {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    return {
      agent,
      ...options,
    };
  }
  return options;
}

async function apiFetch(path: APIPath, options: RequestInit): Promise<unknown> {
  const requestId = makeRequestId();
  const url = join(path);
  logRequest(requestId, url, options);
  const response = await fetch(url, makeOptions(url, options));

  if (!response.ok) {
    logError(requestId, response.status);
    throw new APIError(response.status.toString(), HttpStatusCode.INTERNAL_SERVER, true, JSON.stringify(response));
  }

  if (response.status === 201 || response.status === 204) {
    return response;
  }

  const json = await response.json();
  logResponse(requestId, json);

  return json;
}

export async function sendGetRequest(path: APIPath): Promise<unknown> {
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      authorization: 'Basic YWRtaW46YWRtaW4=',
    },
  };
  return apiFetch(path, options);
}

export async function sendPostRequest(path: APIPath, body?: unknown): Promise<unknown> {
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
