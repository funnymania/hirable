Web Service  
[X] - Create Tables. Update them on rds.
[X] - Define cron jobs  
[X] - supportedOrgs needs to be stored from database and grabbed in a sorted fashion (to allow binary-searching on clients)
[ ] - search API: (params can be role, orgname, location) /v1/cards
[ ] - private insert_card: (API token, url, location, role)
[ ] - makeOFficial: (create an API token, manually find comp in supported orgs or add if it doesnt exist). official_orgs can insert using their api token to associated orgid. 
an optional userInfo parameter which can be used for custom results.
[ ] - nodejs server will be running on ec2 instance

Client
[ ] - Testing + Review. Address anything that feels off.

Refactoring  
[ ] - file reading and writing can be a single method being passed unicorn
names (facebook, twitter)  

Bug Fixes  
[ ] - Some of these might no longer be supported. See which of these can be fixed.  
[ ] - Fix all that is possible. Re-tool supported list for frontend consumption in chexbox
 