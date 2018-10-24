/**
 * @typedef LoaderArgument
 * @property {string} key - [PrestaShop]{@link https://www.prestashop.com} WebService Key.
 * @property {string} resource - [PrestaShop]{@link https://www.prestashop.com} WebService Resource.
 */

/**
 * Load data to [PrestaShop]{@link https://www.prestashop.com}
 * @function load
 * @public
 * @param {LoaderArgument} args - loader arguments.
 */
module.exports.load = (args) => {
    const { Writable } = require('stream');
    const Client = new require('prestashop-webservice-client')(args.key);
    return new Writable({
        objectMode: true,
        write(chunk, encoding, callback) {
            if(chunk.update) {
                Client.put({
                    resource: args.resource,
                    id: chunk.obj.id,
                    output_format: 'JSON',
                    body: chunk.obj
                })
                .then(() => callback())
                .fail(() => callback(err));
            }
            else if(chunk.create) {
                Client.post({
                    resource: args.resource,
                    output_format: 'JSON',
                    body: chunk.obj
                })
                .then(() => callback())
                .fail(() => callback(err));
            }
            else if(chunk.delete) {
                Client.delete({
                    resource: args.resource,
                    id: chunk.obj.id
                })
                .then(() => callback())
                .fail(() => callback(err));
            }
        }
    });
};