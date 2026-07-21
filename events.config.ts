import type { EventSet } from '@/lib/types';

/**
 * Static historical event dates — no APIs, no maintenance.
 * Only events on/after the BTC data start (2010-08-18) belong here.
 */
export const eventSets: EventSet[] = [
  {
    id: 'world-cup',
    name: 'World Cup finals',
    color: '#4ade80',
    events: [
      { d: '2014-07-13', label: "WC '14" },
      { d: '2018-07-15', label: "WC '18" },
      { d: '2022-12-18', label: "WC '22" },
      { d: '2026-07-19', label: "WC '26" },
    ],
  },
  {
    id: 'us-elections',
    name: 'US elections',
    color: '#f472b6',
    events: [
      { d: '2012-11-06', label: "EL '12" },
      { d: '2016-11-08', label: "EL '16" },
      { d: '2020-11-03', label: "EL '20" },
      { d: '2024-11-05', label: "EL '24" },
    ],
  },
  {
    id: 'olympics',
    name: 'Olympics',
    color: '#facc15',
    events: [
      { d: '2012-07-27', label: "OLY '12" },
      { d: '2016-08-05', label: "OLY '16" },
      { d: '2021-07-23', label: "OLY '21" },
      { d: '2024-07-26', label: "OLY '24" },
    ],
  },
];
