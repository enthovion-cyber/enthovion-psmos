import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsService {
  actionAgingBuckets(actions: Array<{ dueDate: Date | string; status: string }>) {
    const now = Date.now();
    return actions.reduce(
      (buckets, action) => {
        if (action.status === 'CLOSED') return buckets;
        const ageDays = Math.max(0, Math.floor((now - new Date(action.dueDate).getTime()) / 86_400_000));
        if (ageDays <= 30) buckets['0-30'] += 1;
        else if (ageDays <= 60) buckets['31-60'] += 1;
        else if (ageDays <= 90) buckets['61-90'] += 1;
        else buckets['90+'] += 1;
        return buckets;
      },
      { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
    );
  }
}
