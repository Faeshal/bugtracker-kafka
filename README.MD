## Bug Tracker - Kafka

**✨ Sample bug tracker app ([Trello like](https://trello.com/en/tour)) with event-driven microservices architecture using Apache Kafka as message broker for educational purpose**

![node](https://img.shields.io/badge/node-16.13.0-brightgreen) ![express](https://img.shields.io/badge/Express-4.17.1-lightgrey)

![service map](https://i.postimg.cc/y8rqggFw/23-1.png)

## Intro 🌴

- Read: [What is Apache Kafka](https://aws.amazon.com/msk/what-is-kafka/#:~:text=Why%20would%20you%20use%20Kafka,that%20consumes%20streams%20of%20data.) || [Install Kafka with Homebrew](https://www.conduktor.io/kafka/how-to-install-apache-kafka-on-mac-with-homebrew) 📕
- Stack: Nodejs, Express, Postgre, MariaDB, MongoDB, Kafka, JWT Auth, PM2, KrakenD API Gateway
- API Docs: **[Postman](https://www.getpostman.com/collections/33de3709312453dcdc95)**
- Find Redis Streams example ? **[bugtracker-redis](https://github.com/Faeshal/bugtracker-redis)**
- Step run the app :
  - install dependency & setup env for each services
  - install [PM2](https://pm2.keymetrics.io/docs/usage/quick-start/) & run each services with that
  - install [Krakend](https://www.krakend.io/docs/overview/installing/), go to gateway folder & type `krakend run -c krakend.json`
  - ready to go 🏎️

## Detail Services 🔅

**1. Auth (postgree-express) [table:users]**

- endpoint:

  - register
  - login
  - logout
  - refresh jwt token
  - get current user data
  - get all users (+filter by name & offset based pagination)
  - get detail user

- event
  - publish: newUser, newNotif
  - consume: -

**2. Project (mariadb-express) [table:project,card,comment,users]**

- note : here, i am still merging project service with the card service, i think the **coupling is too tight** to be place in separated services and because it is only for learning purpose, so ya i think it's ok to place it in the same service.

- endpoint:

  - create project
  - get projects (+filter by project title & offset based pagination)
  - get detail project
  - update, delete project (cascade delete card)
  - create,update & delete card
  - get cards by projectId (+filter by status & cursor based pagination)
  - get detail card

- event
  - publish: newProject, newCard, deleteProject, updateCard, changeCardStatus, newNotif
  - consume: newUser, newComment, deleteComment

**3. Comment (mariadb-express) [table:comment,users,card,project]**

- endpoint:

  - create comment (when comment create, totalComment in card must be update too)
  - get comments by cardId (cursor based pagination)
  - get detail comments
  - delete comment

- event:
  - publish: newComment, deleteComment, newNotif
  - consume: newUser, newProject, newCard, updateCard, deleteProject, updateCardStatus

**4. Notif (MongoDB-express) [collections: notif ]**

- endpoint:

  - get notifications by userId (mongoose paginate). type notification: registration, create project, delete project, create card, change status card, create commet

- event:
  - publish: -
  - consume: newNotif

## what's missing ? (reason: dont have free time to add it) 🙏

- you can add, category services for grouping card inside project
- better error handling & query validation
- some primary feature, ex: forgot password, change password, kick member from project, advance permission etc..

## improvement that can be done 🚧

- better try, fault & storage mechanism
- write unit & integration test
- if you have a lot of free time, you can add docker & kubernetes on top of it

🗡 **July 2022 - [faeshal.com](https://faeshal.com)**
