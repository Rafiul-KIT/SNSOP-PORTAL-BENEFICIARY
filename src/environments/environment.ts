import { UnderConstruction } from "../app/pages/under-construction/under-construction";

export const environment = {
  production: true,
  env: 'prod',
  useHash: true,
  globalApi: 'https://gwapp.southsudansafetynet.info/mis_server/',
  modelApi: 'https://devmismodel.southsudansafetynet.info/',
  portals: {
    master: '/v2',
    UnderConstruction: '/v2/#/under-construction',
    masterSettings: '/v2/#/user-management/users',
    surveyCTO: '/v2/#/cto-dashboard',
    mNe: '/v2/#/monitoring-evaluation/beneficiary-enrolment-summary',
    beneficiary: '/v2/beneficiary/',
    payment: '/v2/payment',
    grm: '/v2/grm',
    report: '/v2/#/home/metabase',
    economicOpportunities: '/v2/#/economic-opportunities/dashboard',
    dms: '/v2/dms/',
  },
  authBackend: 'https://gwapp.southsudansafetynet.info/mis_auth',
  reportApi: 'https://gwapp.southsudansafetynet.info/mis_report/',
  cookie_name:'mis_ta'
};
