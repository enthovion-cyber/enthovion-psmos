export type LopaHistoryDiff = { eventId:string; rows:Array<{field:string;previousValue:unknown;newValue:unknown;changeType:string}> };
