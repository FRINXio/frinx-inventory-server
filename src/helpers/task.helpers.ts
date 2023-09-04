import { v4 as uuid } from 'uuid';
import { isAfterDate, isBeforeDate } from './utils.helpers';
import { ApiPollDataArray } from '../external-api/conductor-network-types';
import { toGraphId } from './id-helper';

type FilterPollDataArgs = {
  queueName?: string | null;
  workerId?: string | null;
  domain?: string | null;
  afterDate?: string | null;
  beforeDate?: string | null;
};
export function filterPollData(pollData: ApiPollDataArray, filters?: FilterPollDataArgs | null): ApiPollDataArray {
  if (filters == null) return pollData;

  const { queueName, workerId, domain, beforeDate, afterDate } = filters;
  const beforeDateFormat = beforeDate != null ? new Date(beforeDate) : null;
  const afterDateFormat = afterDate != null ? new Date(afterDate) : null;

  if (afterDateFormat != null && beforeDateFormat != null && afterDateFormat.getTime() >= beforeDateFormat.getTime())
    throw new Error('afterDate must be smaller than beforeDate');

  return pollData.filter((polldata) => {
    if (
      queueName != null &&
      polldata.queueName != null &&
      queueName.length !== 0 &&
      !polldata.queueName.toLowerCase().includes(queueName.toLowerCase())
    )
      return false;

    if (workerId != null && workerId.length !== 0 && polldata.workerId != null && polldata.workerId !== workerId)
      return false;

    if (
      domain != null &&
      polldata.domain != null &&
      domain.length !== 0 &&
      !polldata.domain.toLowerCase().includes(domain.toLowerCase())
    )
      return false;

    if (
      beforeDateFormat != null &&
      polldata.lastPollTime != null &&
      !isBeforeDate(new Date(polldata.lastPollTime), beforeDateFormat)
    )
      return false;

    if (
      afterDateFormat != null &&
      polldata.lastPollTime != null &&
      !isAfterDate(new Date(polldata.lastPollTime), afterDateFormat)
    )
      return false;

    return true;
  });
}

export function makeFromApiToGraphQLPollData(pollData: ApiPollDataArray) {
  return pollData.map((polldata) => ({
    ...(polldata.lastPollTime != null && { lastPollTime: new Date(polldata.lastPollTime).toISOString() }),
    ...(polldata.queueName != null && { queueName: polldata.queueName }),
    ...(polldata.workerId != null && { workerId: polldata.workerId }),
    ...(polldata.domain != null && { domain: polldata.domain }),
    id: toGraphId('PollData', uuid()),
  }));
}
