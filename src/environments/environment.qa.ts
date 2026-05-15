export const environment = {
  production: true,
  env: 'qa',
  useHash: true,
  domain: 'https://qa-mis.southsudansafetynet.info',
  globalApi: 'https://qa-gwapp.southsudansafetynet.info/mis_server/',
  portals: {
    master: 'https://qa-mis.southsudansafetynet.info/v2',
    masterSettings: 'https://qa-mis.southsudansafetynet.info/v2/#/user-management/users',
    UnderConstruction: 'https://qa-mis.southsudansafetynet.info/v2/#/under-construction',
    surveyCTO: 'https://qa-mis.southsudansafetynet.info/v2/#/cto-dashboard',
    mNe: 'https://qa-mis.southsudansafetynet.info/v2/#/monitoring-evaluation/beneficiary-enrolment-summary',
    beneficiary: 'https://qa-mis.southsudansafetynet.info/v2/beneficiary',
    payment: 'https://qa-mis.southsudansafetynet.info/v2/payment',
    grm: 'https://qa-mis.southsudansafetynet.info/v2/grm',
    report: 'https://qa-mis.southsudansafetynet.info/v2/#/home/metabase',
    economicOpportunities: 'https://qa-mis.southsudansafetynet.info/v2/#/economic-opportunities/dashboard'
  },
  authBackend: 'https://qa-gwapp.southsudansafetynet.info/mis_auth',
  reportApi: 'https://qa-gwapp.southsudansafetynet.info/mis_report/',
  cookie_name:'mis_ta'
};
