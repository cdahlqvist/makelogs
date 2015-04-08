var argv = require('../argv');
var client = require('../_client');

module.exports = function createIndex(indexName, disableall, docvalues) {
  argv.log('ensuring index "%s" exists', indexName);

  var indexBody = {
    settings: {
      index: {
        number_of_shards: argv.shards,
        number_of_replicas: argv.replicas
      },
      analysis: {
        analyzer: {
          url: {
            type: 'standard',
            tokenizer: 'uax_url_email',
            max_token_length: 1000
          }
        }
      }
    },
    mappings: {
      _default_: {
        _timestamp: {
          enabled: true,
          store: 'yes'
        },
        properties: {
          '@timestamp': {
            type: 'date'
          },
          id: {
            type: 'integer',
            index: 'not_analyzed',
            include_in_all: false
          },
          agent: {
            type: 'multi_field',
            fields: {
              agent: {
                type: 'string',
                index: 'analyzed'
              },
              raw: {
                type: 'string',
                index: 'not_analyzed'
              }
            }
          },
          request: {
            type: 'multi_field',
            fields: {
              request: {
                type: 'string',
                index: 'analyzed'
              },
              raw: {
                type: 'string',
                index: 'not_analyzed'
              }
            }
          },
          clientip: {
            type: 'ip'
          },
          ip: {
            type: 'ip'
          },
          memory: {
            type: 'double'
          },
          bytes: {
            type: 'long'
          },
          referer: {
            type: 'string',
            index: 'not_analyzed'
          },
          response: {
            type: 'string',
            index: 'not_analyzed'
          },
          geo: {
            properties: {
              srcdest: {
                type: 'string',
                index: 'not_analyzed'
              },
              dest: {
                type: 'string',
                index: 'not_analyzed'
              },
              src: {
                type: 'string',
                index: 'not_analyzed'
              },
              coordinates: {
                type: 'geo_point'
              }
            }
          },
          meta: {
            properties: {
              related: {
                type: 'string',
              },
              char: {
                type: 'string',
                index: 'not_analyzed'
              },
              user: {
                properties: {
                  firstname: {
                    type: 'string',
                  },
                  lastname: {
                    type: 'integer',
                    index: 'not_analyzed'
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  if (disableall) {
    indexBody["mappings"]["_default_"]["_all"] = { "enabled" : false }
  }

  if (docvalues) {
    indexBody["mappings"]["_default_"]["properties"]["agent"]["fields"]["raw"]["doc_values"] = true;
    indexBody["mappings"]["_default_"]["properties"]["request"]["fields"]["raw"]["doc_values"] = true;
    indexBody["mappings"]["_default_"]["properties"]["clientip"]["doc_values"] = true;
    indexBody["mappings"]["_default_"]["properties"]["ip"]["doc_values"] = true;
    indexBody["mappings"]["_default_"]["properties"]["memory"]["doc_values"] = true;
    indexBody["mappings"]["_default_"]["properties"]["referer"]["doc_values"] = true;
    indexBody["mappings"]["_default_"]["properties"]["response"]["doc_values"] = true;
    indexBody["mappings"]["_default_"]["properties"]["bytes"]["doc_values"] = true;
    indexBody["mappings"]["_default_"]["properties"]["@timestamp"]["doc_values"] = true;
    indexBody["mappings"]["_default_"]["properties"]["geo"]["properties"]["srcdest"]["doc_values"] = true;
    indexBody["mappings"]["_default_"]["properties"]["geo"]["properties"]["dest"]["doc_values"] = true;
    indexBody["mappings"]["_default_"]["properties"]["geo"]["properties"]["src"]["doc_values"] = true;
    indexBody["mappings"]["_default_"]["properties"]["geo"]["properties"]["coordinates"]["doc_values"] = true
  }

  argv.log('Mapping to be used:', JSON.stringify(indexBody));

  return client.usable
  .then(function () {
    return client.indices.create({
      ignore: 400,
      index: indexName,
      body: indexBody
    });
  })
  .then(function () {
    return client.cluster.health({
      index: indexName,
      waitForStatus: 'yellow'
    });
  });
};
