import { MongoClient } from "mongodb";
//for mongodb type error handling

/* eslint no-var: "off" */

declare global {
    var mongoClientPromise: Promise<MongoClient> | undefined;
}
export { };
