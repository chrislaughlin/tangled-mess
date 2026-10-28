// Synthetic records: tool projects and repositories have separate identities.
const repositories = {
 api: {name:'payments-api',path:'/sample/acme/payments-api'},
 web: {name:'storefront',path:'/sample/acme/storefront'},
 ios: {name:'mobile-ios',path:'/sample/acme/mobile-ios'},
 identity: {name:'identity-service',path:'/sample/acme/identity'},
 search: {name:'search-indexer',path:'/sample/acme/search'}
};
const toolProjects = {
 cxpay:{name:'Payments',tool:'Codex',repos:['api','web']},
 clpay:{name:'Payment rollout',tool:'Claude desktop',repos:['api']},
 curpay:{name:'Commerce workspace',tool:'Cursor',repos:['api','web']},
 cxmobile:{name:'Mobile',tool:'Codex',repos:['ios']},
 clidentity:{name:'Identity',tool:'Claude desktop',repos:['identity']},
 opsearch:{name:'Search experiments',tool:'OpenCode',repos:['search']},
 clresearch:{name:'Checkout research',tool:'Claude desktop',repos:[]}
};
const sessions = [
 {id:'cx-101',work:'checkout',project:'cxpay',repo:'api',title:'Implement idempotency adapter',state:'Needs input',branch:'feat/idempotency',summary:'Adapter is ready. Waiting for the v1 fallback policy decision.',next:'Confirm whether v1 fallback stays enabled.'},
 {id:'cx-102',work:'checkout',project:'cxpay',repo:'api',title:'Repair contract tests',state:'Running',branch:'test/retry-contract',summary:'A second Codex session in a separate worktree is investigating the same legacy retry path.',next:'Review the proposed assertions when the run completes.'},
 {id:'cu-103',work:'checkout',project:'curpay',repo:'web',title:'Update checkout error states',state:'Ready for review',branch:'feat/checkout-errors',summary:'Cursor added retry messaging in the frontend repository.',next:'Check the UI against the API error contract.'},
 {id:'cl-104',work:'checkout',project:'clpay',repo:'api',title:'Review rollback safety',state:'Paused',branch:'feat/idempotency',summary:'Claude reviewed the same branch used by the adapter session. Its rollback concern is unresolved.',next:'Compare the rollback concern with the fallback decision.'},
 {id:'cl-105',work:'checkout',project:'clresearch',repo:null,title:'Investigate duplicate-charge reports',state:'Completed',branch:null,summary:'A desktop research conversation with no repository. It established the customer-facing failure scenario.',next:'Use the findings when checking acceptance criteria.'},
 {id:'cx-106',work:'schema',project:'cxpay',repo:'api',title:'Payment schema migration',state:'Ready for review',branch:'feat/payment-schema',summary:'Schema migration approved; final merge checks remain.',next:'Review the migration ordering.'},
 {id:'cx-107',work:'mobile',project:'cxmobile',repo:'ios',title:'Integrate payment client',state:'Blocked',branch:'feat/payment-client',summary:'Client integration waits on the upstream fallback policy.',next:'Resume after the checkout decision.'},
 {id:'cl-108',work:'mobile',project:'clpay',repo:'api',title:'Document mobile API compatibility',state:'Paused',branch:'docs/mobile-contract',summary:'API documentation work belongs to the mobile objective while using the payments repository.',next:'Confirm the mobile contract with the client session.'},
 {id:'cu-109',work:'refund',project:'curpay',repo:'web',title:'Support refund screen',state:'Paused',branch:'feat/refund-ui',summary:'Draft screen saved in the same Cursor workspace used for checkout.',next:'Check retry guarantees before completing the flow.'},
 {id:'cl-110',work:'auth',project:'clidentity',repo:'identity',title:'Token refresh implementation',state:'Needs input',branch:'fix/token-expiry',summary:'Implementation is complete but the expiry-boundary test fails.',next:'Clarify the allowed clock skew.'},
 {id:'cx-111',work:'auth',project:'clidentity',repo:'identity',title:'Review expiry regression',state:'Ready for review',branch:'fix/token-expiry',summary:'Independent review identified an off-by-one boundary in token expiry.',next:'Compare review notes with the failing test.'},
 {id:'oc-112',work:'search',project:'opsearch',repo:'search',title:'Compare indexing strategies',state:'Paused',branch:'experiment/indexing',summary:'Two candidate indexing strategies are recorded in exploration notes.',next:'Choose an approach before implementation.'}
];
