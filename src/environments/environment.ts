import { UnderConstruction } from "../app/pages/under-construction/under-construction";

export const environment = {
  production: true,
  env: 'prod',
  useHash: true,
  domain: 'https://mis.southsudansafetynet.info',
  globalApi: 'https://gwapp.southsudansafetynet.info/mis_server/',
  modelApi: 'https://devmismodel.southsudansafetynet.info/',
  portals: {
    master: 'https://mis.southsudansafetynet.info/v2',
    UnderConstruction: 'https://mis.southsudansafetynet.info/v2/#/under-construction',
    masterSettings: 'https://mis.southsudansafetynet.info/v2/#/user-management/users',
    surveyCTO: 'https://mis.southsudansafetynet.info/v2/#/cto-dashboard',
    mNe: 'https://mis.southsudansafetynet.info/v2/#/monitoring-evaluation/beneficiary-enrolment-summary',
    beneficiary: 'https://mis.southsudansafetynet.info/v2/beneficiary/',
    payment: 'https://mis.southsudansafetynet.info/v2/payment',
    grm: 'https://mis.southsudansafetynet.info/v2/grm',
    report: 'https://mis.southsudansafetynet.info/v2/#/home/metabase',
    economicOpportunities: 'https://mis.southsudansafetynet.info/v2/#/economic-opportunities/dashboard',
    dms: 'https://mis.southsudansafetynet.info/v2/dms/',
  },
  authBackend: 'https://gwapp.southsudansafetynet.info/mis_auth',
  reportApi: 'https://gwapp.southsudansafetynet.info/mis_report/',
  cookie_name:'mis_ta'
};
