## Bug Tracker (Redis Stream Version)

![service map](https://i.postimg.cc/1t2JNzZB/bugtracker-drawio-drawio-1.png)

#### Postman: https://www.getpostman.com/collections/33de3709312453dcdc95

## List Of Services

1. Auth (postgree-express) [table:users]

   - register ✅
   - login ✅
   - logout ✅
   - refresh token (jwt) ✅
   - get current user data ✅
   - get all users (+filter by name & offset based pagination) ✅
   - get detail user ✅

2. Project (mariadb-express) [table:project,card,comment,users]

   - create project ✅
   - get projects (+filter by project title & offset based pagination) ✅
   - get detail project ✅
   - update project ✅
   - delete project (cascade delete card) ✅
   - create card ✅
   - update card ✅
   - delete card ✅
   - get cards by projectId (+filter by status & cursor based pagination) ✅
   - get detail card ✅

3. Comment (mariadb-express) [table:comment,users,card,project]

   - create comment (when comment create, totalComment in card must be update too) ✅
   - get comments by cardId (cursor based pagination) ✅
   - get detail comments ✅
   - delete comment ✅

4. Notif (MongoDB-express) [collections: notif,users ]

   - get notifications by userId (mongoose paginate) ✅

   type notification:

   - registration
   - create project
   - delete project
   - create card
   - change status card
   - create commet

## List Of Event

1. Auth:

   ### Publish :

   - newUser
   - newNotif

   ### Consume :

   -

2. Project:

   #### Publish :

   - newProject
   - newCard
   - deleteProject
   - updateCard
   - changeCardStatus
   - newNotif

   #### Consume :

   - newUser
   - newComment
   - deleteComment

3. Comment:

   #### Publish :

   - newComment
   - deleteComment
   - newNotif

   #### Consume :

   - newUser
   - newProject
   - newCard
   - updateCard
   - deleteProject
   - updateCardStatus

4. Notif:

   #### Publish :

   -

   #### Consume :

   - newNotif

## complementary thing

- setup krakend api gateway ✅
- clean up postman documentation
- add good readme repository documentation

## what's missing ? (reason: dont have free time to add it)

- better error handling
- query validation
- some primary feature, ex: forgot password, change password, kick member from project, advance permission etc.. (don't have much time to add this feature)

## improvement that can be done

- add security package (hpp,helmet,csrf etc)
- can add better message broker for advance event manager, ex: kafka
- if still wanna using redis stream, please setup consumer group to each services for better load balancing
- setup better event data store scenario, ex: if more than 90 days, store event to file not just in memory
- write unit & integration test
- add docker & kubernetes (if you have a lot of free time)
