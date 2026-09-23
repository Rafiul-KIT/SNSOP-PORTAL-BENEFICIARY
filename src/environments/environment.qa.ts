export const environment = {
  production: true,
  env: 'qa',
  useHash: true,
  globalApi: 'https://qa-gwapp.southsudansafetynet.info/mis_server/',
  modelApi: 'https://devmismodel.southsudansafetynet.info/',
  portals: {
    master: '/v2',
    masterSettings: '/v2/#/user-management/users',
    UnderConstruction: '/v2/#/under-construction',
    surveyCTO: '/v2/#/cto-dashboard',
    mNe: '/v2/#/monitoring-evaluation/beneficiary-enrolment-summary',
    beneficiary: '/v2/beneficiary',
    payment: '/v2/payment',
    grm: '/v2/grm',
    report: '/v2/#/home/metabase',
    economicOpportunities: '/v2/#/economic-opportunities/dashboard',
    dms: '/v2/dms/',
  },
  authBackend: 'https://qa-gwapp.southsudansafetynet.info/mis_auth',
  reportApi: 'https://qa-gwapp.southsudansafetynet.info/mis_report/',
  cookie_name:'mis_ta'
};
