const EventEmitter = require('events');
const Client = new require('prestashop-webservice-client');

class Loader {
    constructor(args) {
        this.key = args.key;
        this.ssl = args.ssl;
        this.domain = args.domain;
        this.path = args.path;
        this.resource = args.resource;
        this.client = new Client(this.url);
    }

    get url() {
        return [
            this.ssl ? 'https' : 'http',
            '://',
            this.key,
            '@',
            this.domain,
            this.path ? `/${this.path}` : ''
        ].join('');
    }

    load(obj) {
        let self = this;
        return new Promise((resolve, reject) => {
            if (obj['id']) {
                self.client.post({
                    resource: self.resource,
                    output_format: 'JSON',
                    body: obj
                })
                .then(resolve)
                .catch((err) => {
                    reject(new Error("error post load ps"));
                });
            }
            else {
                self.client.put({
                    resource: self.resource,
                    id: obj.id,
                    output_format: 'JSON',
                    body: obj
                })
                .then(resolve)
                .catch((err) => {
                    reject(new Error("error put load ps"));
                });
            }
        });
    }
}

class Extractor extends EventEmitter
{
    constructor(args) {
        super();
        this.key = args.key;
        this.ssl = args.ssl;
        this.domain = args.domain;
        this.path = args.path;
        this.resource = args.resource;
        this.query = args.query;
        this.cache = args.cache;
        this.client = new Client(this.url);
    }

    get url() {
        return [
            this.ssl ? 'https' : 'http',
            '://',
            this.key,
            '@',
            this.domain,
            this.path ? `/${this.path}` : ''
        ].join('');
    }

    queryWS(skip, limit, resolve, reject, self) {
        setTimeout(() => {
            self.query.limit = `${skip},${limit}`;
            self.client.get({
                resource: self.resource,
                ...self.query
            })
            .then((res) => {
                let promises = [];
                for (const item of res.response[resource]) {
                    promises.push(self.cache.createOne(item));
                }
                if(res.response[resource].length === limit) {
                    self.queryWS(skip + limit, limit, resolve, reject, self);
                } else {
                    if(self.emit('data-etl-extractor-ready')) {
                        resolve();
                    } else {
                        reject(new Error("query WS prestashop - no handlers"));
                    }
                }
                return Promise.all(promises);
            })
            .catch((err) => {
                reject(new Error("query WS prestashop error"));
            });
        }, 100);
    }

    init() {
        let self = this;
        let skip = 0;
        let limit = 25;

        return new Promise((resolve, reject) => {
            self.queryWS(skip, limit, resolve, reject, self);
        });
    }

    extract(obj) {
        if (!this.cache.isEmpty) {
            return this.cache.readAndDeleteOne(obj);
        } else {
            return false;
        }
    }
}

module.exports.Extractor = Extractor;
module.exports.Loader = Loader;