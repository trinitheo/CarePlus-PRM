import { UserRole } from './types';

export const DEFAULT_DASHBOARD_SETTINGS: Record<UserRole, Record<'compact' | 'medium' | 'expanded', {
  order: string[];
  visibility: Record<string, boolean>;
  sizes: Record<string, '1x1' | '1x2' | '2x1' | '2x2' | '2x3' | '4x2' | '0.5x0.5'>;
}>> = {
  clinician: {
    compact: {
      order: ['schedule', 'messages', 'reminders', 'results', 'patients', 'calls'],
      visibility: { schedule: true, messages: true, reminders: true, results: true, patients: true, calls: true },
      sizes: { schedule: '2x2', messages: '2x2', reminders: '2x2', results: '1x1', patients: '1x1', calls: '1x1' }
    },
    medium: {
      order: ['schedule', 'messages', 'reminders', 'results', 'patients', 'calls'],
      visibility: { schedule: true, messages: true, reminders: true, results: true, patients: true, calls: true },
      sizes: { schedule: '2x2', messages: '2x2', reminders: '2x2', results: '2x1', patients: '2x1', calls: '2x1' }
    },
    expanded: {
      order: ['schedule', 'messages', 'reminders', 'results', 'patients', 'calls'],
      visibility: { schedule: true, messages: true, reminders: true, results: true, patients: true, calls: true },
      sizes: { schedule: '2x2', messages: '2x2', reminders: '2x2', results: '2x1', patients: '2x1', calls: '2x1' }
    }
  },
  nurse: {
    compact: {
      order: ['queue', 'messages', 'reminders', 'med_flags', 'schedule', 'calls'],
      visibility: { queue: true, messages: true, reminders: true, med_flags: true, schedule: true, calls: true },
      sizes: { queue: '2x2', messages: '2x2', reminders: '2x2', med_flags: '1x1', schedule: '1x1', calls: '1x1' }
    },
    medium: {
      order: ['queue', 'messages', 'reminders', 'med_flags', 'schedule', 'calls'],
      visibility: { queue: true, messages: true, reminders: true, med_flags: true, schedule: true, calls: true },
      sizes: { queue: '2x2', messages: '2x2', reminders: '2x2', med_flags: '2x1', schedule: '2x1', calls: '2x1' }
    },
    expanded: {
      order: ['queue', 'messages', 'reminders', 'med_flags', 'schedule', 'calls'],
      visibility: { queue: true, messages: true, reminders: true, med_flags: true, schedule: true, calls: true },
      sizes: { queue: '2x2', messages: '2x2', reminders: '2x2', med_flags: '2x1', schedule: '2x1', calls: '2x1' }
    }
  },
  allied_health: {
    compact: {
      order: ['patients', 'messages', 'reminders', 'referrals', 'schedule', 'calls'],
      visibility: { patients: true, messages: true, reminders: true, referrals: true, schedule: true, calls: true },
      sizes: { patients: '2x2', messages: '2x2', reminders: '2x2', referrals: '1x1', schedule: '1x1', calls: '1x1' }
    },
    medium: {
      order: ['patients', 'messages', 'reminders', 'referrals', 'schedule', 'calls'],
      visibility: { patients: true, messages: true, reminders: true, referrals: true, schedule: true, calls: true },
      sizes: { patients: '2x2', messages: '2x2', reminders: '2x2', referrals: '2x1', schedule: '2x1', calls: '2x1' }
    },
    expanded: {
      order: ['patients', 'messages', 'reminders', 'referrals', 'schedule', 'calls'],
      visibility: { patients: true, messages: true, reminders: true, referrals: true, schedule: true, calls: true },
      sizes: { patients: '2x2', messages: '2x2', reminders: '2x2', referrals: '2x1', schedule: '2x1', calls: '2x1' }
    }
  },
  admin: {
    compact: {
      order: ['overview', 'messages', 'reminders', 'directory', 'queue', 'audit', 'schedule'],
      visibility: { overview: true, messages: true, reminders: true, directory: true, queue: true, audit: true, schedule: true },
      sizes: { overview: '2x2', messages: '2x2', reminders: '2x2', directory: '1x1', queue: '1x1', audit: '1x1', schedule: '1x1' }
    },
    medium: {
      order: ['overview', 'messages', 'reminders', 'directory', 'queue', 'audit', 'schedule'],
      visibility: { overview: true, messages: true, reminders: true, directory: true, queue: true, audit: true, schedule: true },
      sizes: { overview: '2x2', messages: '2x2', reminders: '2x2', directory: '2x1', queue: '2x1', audit: '2x1', schedule: '2x1' }
    },
    expanded: {
      order: ['overview', 'messages', 'reminders', 'directory', 'queue', 'audit', 'schedule'],
      visibility: { overview: true, messages: true, reminders: true, directory: true, queue: true, audit: true, schedule: true },
      sizes: { overview: '2x2', messages: '2x2', reminders: '2x2', directory: '2x1', queue: '2x1', audit: '2x1', schedule: '2x1' }
    }
  },
  billing: {
    compact: {
      order: ['billing', 'messages', 'reminders', 'schedule', 'patients', 'calls'],
      visibility: { billing: true, messages: true, reminders: true, schedule: true, patients: true, calls: true },
      sizes: { billing: '2x2', messages: '2x2', reminders: '2x2', schedule: '1x1', patients: '1x1', calls: '1x1' }
    },
    medium: {
      order: ['billing', 'messages', 'reminders', 'schedule', 'patients', 'calls'],
      visibility: { billing: true, messages: true, reminders: true, schedule: true, patients: true, calls: true },
      sizes: { billing: '2x2', messages: '2x2', reminders: '2x2', schedule: '2x1', patients: '2x1', calls: '2x1' }
    },
    expanded: {
      order: ['billing', 'messages', 'reminders', 'schedule', 'patients', 'calls'],
      visibility: { billing: true, messages: true, reminders: true, schedule: true, patients: true, calls: true },
      sizes: { billing: '2x2', messages: '2x2', reminders: '2x2', schedule: '2x1', patients: '2x1', calls: '2x1' }
    }
  },
  manager: {
    compact: {
      order: ['overview', 'messages', 'reminders', 'directory', 'queue', 'audit', 'schedule'],
      visibility: { overview: true, messages: true, reminders: true, directory: true, queue: true, audit: true, schedule: true },
      sizes: { overview: '2x2', messages: '2x2', reminders: '2x2', directory: '1x1', queue: '1x1', audit: '1x1', schedule: '1x1' }
    },
    medium: {
      order: ['overview', 'messages', 'reminders', 'directory', 'queue', 'audit', 'schedule'],
      visibility: { overview: true, messages: true, reminders: true, directory: true, queue: true, audit: true, schedule: true },
      sizes: { overview: '2x2', messages: '2x2', reminders: '2x2', directory: '2x1', queue: '2x1', audit: '2x1', schedule: '2x1' }
    },
    expanded: {
      order: ['overview', 'messages', 'reminders', 'directory', 'queue', 'audit', 'schedule'],
      visibility: { overview: true, messages: true, reminders: true, directory: true, queue: true, audit: true, schedule: true },
      sizes: { overview: '2x2', messages: '2x2', reminders: '2x2', directory: '2x1', queue: '2x1', audit: '2x1', schedule: '2x1' }
    }
  },
  front_desk: {
    compact: {
      order: ['overview', 'messages', 'reminders', 'directory', 'queue', 'audit', 'schedule'],
      visibility: { overview: true, messages: true, reminders: true, directory: true, queue: true, audit: true, schedule: true },
      sizes: { overview: '2x2', messages: '2x2', reminders: '2x2', directory: '1x1', queue: '1x1', audit: '1x1', schedule: '1x1' }
    },
    medium: {
      order: ['overview', 'messages', 'reminders', 'directory', 'queue', 'audit', 'schedule'],
      visibility: { overview: true, messages: true, reminders: true, directory: true, queue: true, audit: true, schedule: true },
      sizes: { overview: '2x2', messages: '2x2', reminders: '2x2', directory: '2x1', queue: '2x1', audit: '2x1', schedule: '2x1' }
    },
    expanded: {
      order: ['overview', 'messages', 'reminders', 'directory', 'queue', 'audit', 'schedule'],
      visibility: { overview: true, messages: true, reminders: true, directory: true, queue: true, audit: true, schedule: true },
      sizes: { overview: '2x2', messages: '2x2', reminders: '2x2', directory: '2x1', queue: '2x1', audit: '2x1', schedule: '2x1' }
    }
  },
  patient: {
    compact: {
      order: ['vitals', 'medications', 'messages', 'reminders', 'schedule', 'health_sync'],
      visibility: { vitals: true, medications: true, messages: true, reminders: true, schedule: true, health_sync: true },
      sizes: { vitals: '2x2', medications: '2x2', messages: '2x2', reminders: '1x2', schedule: '1x1', health_sync: '1x1' }
    },
    medium: {
      order: ['vitals', 'medications', 'messages', 'reminders', 'schedule', 'health_sync'],
      visibility: { vitals: true, medications: true, messages: true, reminders: true, schedule: true, health_sync: true },
      sizes: { vitals: '2x2', medications: '2x2', messages: '2x2', reminders: '2x1', schedule: '2x1', health_sync: '2x1' }
    },
    expanded: {
      order: ['vitals', 'medications', 'messages', 'reminders', 'schedule', 'health_sync'],
      visibility: { vitals: true, medications: true, messages: true, reminders: true, schedule: true, health_sync: true },
      sizes: { vitals: '2x2', medications: '2x2', messages: '2x2', reminders: '1x2', schedule: '1x1', health_sync: '1x1' }
    }
  },
  pt: {
    compact: {
      order: ['patients', 'messages', 'reminders', 'referrals', 'schedule', 'calls'],
      visibility: { patients: true, messages: true, reminders: true, referrals: true, schedule: true, calls: true },
      sizes: { patients: '2x2', messages: '2x2', reminders: '2x2', referrals: '1x1', schedule: '1x1', calls: '1x1' }
    },
    medium: {
      order: ['patients', 'messages', 'reminders', 'referrals', 'schedule', 'calls'],
      visibility: { patients: true, messages: true, reminders: true, referrals: true, schedule: true, calls: true },
      sizes: { patients: '2x2', messages: '2x2', reminders: '2x2', referrals: '2x1', schedule: '2x1', calls: '2x1' }
    },
    expanded: {
      order: ['patients', 'messages', 'reminders', 'referrals', 'schedule', 'calls'],
      visibility: { patients: true, messages: true, reminders: true, referrals: true, schedule: true, calls: true },
      sizes: { patients: '2x2', messages: '2x2', reminders: '2x2', referrals: '2x1', schedule: '2x1', calls: '2x1' }
    }
  },
  read_only: {
    compact: {
      order: ['patients', 'messages', 'reminders', 'referrals', 'schedule', 'calls'],
      visibility: { patients: true, messages: true, reminders: true, referrals: true, schedule: true, calls: true },
      sizes: { patients: '2x2', messages: '2x2', reminders: '2x2', referrals: '1x1', schedule: '1x1', calls: '1x1' }
    },
    medium: {
      order: ['patients', 'messages', 'reminders', 'referrals', 'schedule', 'calls'],
      visibility: { patients: true, messages: true, reminders: true, referrals: true, schedule: true, calls: true },
      sizes: { patients: '2x2', messages: '2x2', reminders: '2x2', referrals: '2x1', schedule: '2x1', calls: '2x1' }
    },
    expanded: {
      order: ['patients', 'messages', 'reminders', 'referrals', 'schedule', 'calls'],
      visibility: { patients: true, messages: true, reminders: true, referrals: true, schedule: true, calls: true },
      sizes: { patients: '2x2', messages: '2x2', reminders: '2x2', referrals: '2x1', schedule: '2x1', calls: '2x1' }
    }
  }
};
