import https from 'https';
import fetch, { RequestInit } from 'node-fetch';
import join from 'url-join';
import getLogger from '../get-logger';
import { ExternalApiError } from './errors';

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

function logError(requestId: string, code: number, data?: unknown) {
  log.error(`request(${requestId}) failed with http-code ${code}, message: ${data ?? 'no data'}`);
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
    const message = await response.text();
    logError(requestId, response.status, message);
    throw new ExternalApiError(response.status, message);
  }

  if (response.status === 201 || response.status === 204) {
    return response;
  }

  // TODO:
  // this is stupid hack because of how conductor API is working
  // it always response with 200 even if it has empty body
  // the change was requested (it should use 201/204 status codes) and once implemented in conductor API
  // we can revert this changes to previous state
  const text = await response.text();

  if (!text.length) {
    return response;
  }

  try {
    const json = JSON.parse(text);
    return json;
  } catch (e) {
    logResponse(requestId, text);
    return text;
  }
}

export async function sendGetRequest(path: APIPath, cookie?: string): Promise<unknown> {
  const options = {
    method: 'GET',
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Content-Type': 'application/json',
      ...(cookie != null ? { cookie } : {}),
    },
  };
  return apiFetch(path, options);
}

export async function sendPostRequest(path: APIPath, body?: unknown, cookie?: string): Promise<unknown> {
  const options = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Content-Type': 'application/json',
      ...(cookie != null ? { cookie } : {}),
    },
  };
  return apiFetch(path, options);
}

export async function sendPutRequest(path: APIPath, body?: unknown, cookie?: string): Promise<unknown> {
  const options = {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Content-Type': 'application/json',
      ...(cookie != null ? { cookie } : {}),
    },
  };
  return apiFetch(path, options);
}

export async function sendPatchRequest(path: APIPath, body?: unknown, cookie?: string): Promise<unknown> {
  const options = {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Content-Type': 'application/json',
      ...(cookie != null ? { cookie } : {}),
    },
  };
  return apiFetch(path, options);
}

export async function sendDeleteRequest(path: APIPath, cookie?: string): Promise<unknown> {
  const options = {
    method: 'DELETE',
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Content-Type': 'application/json',
      ...(cookie != null ? { cookie } : {}),
    },
  };
  return apiFetch(path, options);
}
