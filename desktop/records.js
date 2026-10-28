// Synthetic source records. No real user tickets or code-host records are implied.
const sourceRecords=[
 ['checkout','Ticket','TM-184','Prevent duplicate charges','Shortcut','In progress'],
 ['checkout','Ticket','TM-185','Staged rollout compatibility','Jira','In progress'],
 ['checkout','PR','#418','Idempotency adapter','GitHub','Draft'],
 ['checkout','PR','#421','Checkout retry messaging','GitHub','Review requested'],
 ['schema','Ticket','TM-180','Payment schema','Shortcut','In progress'],
 ['schema','PR','#412','Payment schema migration','GitHub','Approved'],
 ['checkout','PR','#412','Payment schema migration','GitHub','Approved'],
 ['mobile','Ticket','TM-190','Mobile payment client','Shortcut','Blocked'],
 ['mobile','MR','!81','Mobile payment integration','GitLab','Draft'],
 ['refund','Ticket','TM-192','Support refund flow','Jira','Paused'],
 ['refund','PR','#425','Refund screen','GitHub','Draft'],
 ['auth','Ticket','TM-176','Token refresh boundaries','Jira','In progress'],
 ['auth','MR','!72','Handle token expiry','GitLab','Checks failed'],
 ['search','Ticket','TM-141','Search indexing strategy','Shortcut','Paused']
].map(([work,type,id,title,provider,state])=>({work,type,id,title,provider,state,repository:({'#418':'payments-api','#421':'storefront','#412':'payments-api','!81':'mobile-ios','#425':'storefront','!72':'identity-service'})[id]||null,url:'https://example.com',sample:true}));
