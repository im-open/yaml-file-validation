const yaml = require('js-yaml');

const REQUIRED = {
  REQUIRED: 'required',
  WARNING: 'warning',
  INFO: 'info'
};

const LOG_LEVEL = {
  information: 0,
  warning: 1,
  failure: 2,
  validate: level => ['information', 'warning', 'failure'].includes(level)
};

const cleanDocsData = docs => {
  let lines = docs.split('\n');
  let cleaned = '';
  lines.forEach(line => {
    let parts = line.split('#');
    cleaned += `${parts[0]}\n`;
  });
  return cleaned;
};

const YamlLibrary = {
  docs: [],
  KEYWORDS: ['REQUIRED', 'LISTOF'],
  doc: null,

  verifyProperty: function (propertyValue, required, propertyName, keys, failed, warning, info) {
    if (propertyValue == 'DontCascade') {
      // cascade stopped!
      // if it were allowed to cascade, propertyValue would equal undefined or null instead of this string which is a special case
      return;
    }

    let badness =
      propertyName + ' was not included or had no value specified. ' + '(Path: ' + keys + ' )';

    let missing = propertyValue === undefined || propertyValue === null;

    let requiredSwitch =
      typeof required == 'string'
        ? required
        : required && 'REQUIRED' in required
        ? required['REQUIRED']
        : REQUIRED.INFO;

    if (missing) {
      switch (requiredSwitch) {
        case REQUIRED.REQUIRED: {
          failed(badness);
          break;
        }
        case REQUIRED.WARNING: {
          warning(badness);
          break;
        }
        default: {
          info(badness);
          break;
        }
      }
    }
  },

  /*
    This function goes through the "keys" ("Build", "CI", "Link"),
    in order to see if the SAM.YML was defined and has a value
  */
  findValueGivenKeys: function (keys) {
    var value = this.doc;
    var allowCascading = false; // if true, then the errors of child "nodes" will come up if the parent has an error, which can inflate the list of errors shown when it may only be the parent node that is wrong.
    var result;

    keys.forEach(key => {
      if (value != undefined) {
        // if the value is undefined here, it means there are more keys to go through but the parent node was found to be undefined, here we can allow it to cascade or not
        value = value[key];
        result = value;
      } else {
        if (!allowCascading) {
          result = 'DontCascade';
        }
      }
    });

    return result;
  },

  // recursed schema: its the part of the schema that the code is currently on, consider it a smaller piece of JSON instead of the whole thing
  // keys: "Build, CI" this tells the code how it reached the current recursed schema
  // nameOfLastProperty: if the keys are "Build, CI", then this variable would be "Build"
  recurseIntoArray: function (schema, keys, nameOfLastProperty, failed, warning, info) {
    for (let element in schema) {
      let tempKeys = [...keys];
      tempKeys.push(element);

      let verify = [];
      let docValue = this.findValueGivenKeys(tempKeys);
      if (!this.KEYWORDS.includes(element)) {
        verify.push({
          value: docValue,
          required: schema[element],
          element: element,
          keys: tempKeys
        });
      }

      verify.forEach(v => {
        this.verifyProperty(v.value, v.required, v.element, v.keys, failed, warning, info);
      });

      if (typeof schema[element] != 'string') {
        for (let childElement in schema[element]) {
          this.recurseIntoArray(schema[element], tempKeys, element, failed, warning, info);
        }
      }
    }
  },

  // doc: The SAM.YML parsed document
  // schema: the JSON schema to compare the doc to
  checkDocAgainstSchema: function (docIndex, schema, failed, warning, info) {
    this.doc = this.docs[docIndex];
    var keys = [];

    this.recurseIntoArray(schema, keys, null, failed, warning, info);
  },

  loadDocData: function (docs) {
    let docsArray = cleanDocsData(docs).split('---');

    for (let i = 0; i < docsArray.length; i++) {
      let yamlDoc = yaml.load(docsArray[i]);
      // If a doc is empty, whether it's a single doc or included as part of several docs
      // the yaml.load() will return a null or undefined value.  The parser, in a later call,
      // would return a successful validation for null or undefined items.  Changing it
      // to {} will force the parser to check against the schema doc and cause a failure.
      this.docs[i] = yamlDoc == null || yamlDoc == undefined ? {} : yamlDoc;
    }
  }
};

module.exports = { LOG_LEVEL, YamlLibrary };
