/**
 * Created by sanchitgupta001 on 16/12/2019
 */
const { ApolloServer, gql, PubSub } = require('apollo-server');

// type checking is done by graphql internally
const typeDefs = gql`
  type Query {
    hello(name: String!): String! # ! denotes it cannot be null
    user: User
  }

  type User {
    firstLetterOfUserName: String
    id: ID!
    username: String!
  }

  type Error {
    field: String!
    message: String!
  }

  type RegisterResponse {
    error: [Error] # denotes array of Error type
    user: User
  }

  input UserInfo { # input can be used to define argument object types
    username: String!
    password: String!
    age: Int
  }

  type Mutation { # mutations run in order of their declarations if they are called at the same time
    register(userInfo: UserInfo): RegisterResponse!
    login(userInfo: UserInfo): Boolean!
  }

  type Subscription {
    newUser: User! # we want to trigger this subscription everytime new user is created
  }
`;

const NEW_USER = 'NEW_USER';

const resolvers = {
  Subscription: {
    // subscriptions use web sockets under the hood;
    // anyone who is subscribed to this will get an alert
    newUser: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(NEW_USER) // NEW_USER: name of event that is to be triggered on its subscription
    }
  },
  User: {
    // there can be resolvers for types as well apart from Query and Mutation
    firstLetterOfUserName: parent => {
      // parent denotes output from resolver called before the current resolver is run;
      // For Eg: here, it can be register mutation's resolver
      return parent.username[0];
    }
  },
  Query: {
    hello: (parent, { name }) => {
      return `Hey! ${name}`;
    },
    user: () => ({
      id: 1,
      username: 'Bob'
    })
  },
  Mutation: {
    login: async (
      parent,
      { userInfo: { username, password, age } },
      context, // context is passed from Apollo server and consists of data like req, res, pubsub from express,etc which can used across resolvers
      info // parsed version of the query that gets run
    ) => {
      // await checkPassword(password)
      // resolvers can be used asynchronously with any backend layer like SQL, mongo, graph, etc
      return username;
    },
    register: (_, { userInfo: { username } }, { pubsub }) => {
      const user = {
        id: 1,
        username
      };

      pubsub.publish(NEW_USER, {
        newUser: user
      });

      return {
        errors: [
          {
            field: 'username',
            message: 'bad'
          }
        ],
        user
      };
    }
  }
};

const pubsub = new PubSub(); // used to trigger and publish events

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => ({ req, res, pubsub })
});

server.listen().then(({ url }) => console.log(`Server started at ${url}`));
