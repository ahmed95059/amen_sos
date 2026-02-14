import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

export function makeClient(getToken: () => string | null) {
  return new ApolloClient({
    link: new HttpLink({
      uri: import.meta.env.VITE_GRAPHQL_URL,
      headers: {
        authorization: getToken() ? `Bearer ${getToken()}` : ""
      }
    }),
    cache: new InMemoryCache()
  });
}
