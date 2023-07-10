import {isAfterDate, isBeforeDate} from "./utils.helpers";
import {ApiPollDataArray} from "../external-api/conductor-network-types";

type FilterPollDataArgs = {
    queueName?: string | null;
    workerId?: string | null;
    domain?: string | null;
    beforeLastPollTime?: number | null;
    afterLastPollTime?: number | null;
}
export function filterPollData(pollData: ApiPollDataArray, {afterLastPollTime,beforeLastPollTime,queueName,domain,workerId}: FilterPollDataArgs): ApiPollDataArray {
    return pollData.filter((polldata) => {
        if  (queueName && polldata.queueName !== queueName) return false;

        if  (workerId && polldata.workerId !== workerId) return false;

        if  (domain && polldata.domain !== domain) return false;

        if  (beforeLastPollTime != null && !isBeforeDate(new Date(polldata.lastPollTime || 0), new Date(beforeLastPollTime))) return false;

        if (afterLastPollTime && !isAfterDate(new Date(polldata.lastPollTime || 0), new Date(afterLastPollTime))) return false;

        return true;
    });
}

export function makeFromApiToGraphQLPollData(pollData: ApiPollDataArray) {
    return pollData.map((polldata) => ({
        ...(polldata.lastPollTime != null && {lastPollTime: new Date(polldata.lastPollTime).toISOString()}),
        ...(polldata.queueName != null && {queueName: polldata.queueName}),
        ...(polldata.workerId != null && {workerId: polldata.workerId}),
        ...(polldata.domain != null && {domain: polldata.domain}),
    }));
}