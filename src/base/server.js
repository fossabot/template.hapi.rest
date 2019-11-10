/**
 * @flow
 */
require('source-map-support/register');
require('@babel/register');
require('@babel/polyfill');
import Pino from 'hapi-pino';
import Hapi from '@hapi/hapi';
import Inert from '@hapi/inert';
// import Path from 'path';

/**
 * Endpoint that can be created, should have a http method, path and controller that resolves when
 * the path is hit
 * @param {string} method     HTTP method the endpoint must be called with to trigger controller
 * @param {string} path       URL path of endpoint
 * @param {Function} controller Handler function that is triggered when endpoint is hit
 */
export interface EndpointConfig {
  method: string;
  path: string;
  controller?: any; // eslint-disable-line
}

export interface HapiHandler {
  code: Function; // eslint-disable-line
  response: Function; // eslint-disable-line
}

/**
 * Request Error
 * @type {RequestError}
 */
export class RequestError extends Error {
  code: number;

  /**
   * Create a new Request Error
   * @param {string} msg  message to display when returned
   * @param {number} code code to set in Hapi Response
   */
  constructor(msg: string, code: number) {
    super(msg);
    this.code = code;
  }
}

/**
 * Request Object that is passed to the controller as the first parameter
 * from https://github.com/hapijs/hapi/blob/master/API.md#request
 */
export interface HapiRequest {
  server: any; // eslint-disable-line
  headers: any; // eslint-disable-line
  // from path
  params: any; // eslint-disable-line
  // Body of a POST request
  payload: any; // eslint-disable-line
};


/**
 * Abstraction to manage running the server. Instantiate on application server start up
 * inside `entry.js` file or wherever the intial "main" script is
 *
 * @type {Server} class
 */
export class Server {
  server: any; // eslint-disable-line

  /**
   * Server Constructor
   */
  constructor() {
    this.server = Hapi.server({
      port: 3333,
      host: 'localhost',
    });
  }

  /**
   * Shutdown the Hapi Server Properly
   * @param  {Function} callback callback to run after server has shutdown
   * @return {undefined}            no return
   */
  shutdown(callback: Function) { // eslint-disable-line flowtype/no-weak-types
    // TODO: Set Shutdown Timeout from config
    this.server.stop({ timeout: 10000 }).then((err: Error) => {
      if (err) {
        // TODO: Log Hapi Shutdown Error
      }
      callback(err);
    });
  }

  /**
   * Starts the server and registers any plugins
   * @return {Promise} Resolves once server has started
   */
  async run() {
    await this.server.start();
    process.stdout.write('Server started on ' + this.server.info.port);

    await this.server.register({
      plugin: Pino,
      options: {
        prettyPrint: false,
        logEvents: ['response']
      }
    });

    // Serve Docs with OpenAPI and Swagger UI
    // visit at http://localhost:3333/docs/swagger/index.html
    await this.server.register({
      plugin: Inert
    });
  }


  /**
   * Adds an endpoint at the path given handled by the controller
   * @param {EndpointConfig} endpoint configuration
   * @return {undefined}
   */
  addEndpoint({ method, path, controller }: EndpointConfig) {
    this.server.route({
      method,
      path,
      handler: controller,
      options: {
        cors: true
      }
    });
  }

  /**
   * Adds the endpoints given to the server
   * @param {Array<EndpointConfig>} routes Routes to add to the server
   * @returns {undefined}
   */
  addEndpoints(routes: Array<EndpointConfig>) {
    for (let i: number = 0; i < routes.length; i++) {
      this.addEndpoint(routes[i]);
    }
  }
}
