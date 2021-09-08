const REQUIRED = {
  REQUIRED: 'required',
  WARNING: 'warning',
  INFO: 'info'
};

module.exports = {
  verifyProperty: function (propertyValue, required, propertyName, keys, failed, warning, info) {
    var badness =
      propertyName + ' was not included or had no value specified. ' + '(Path: ' + keys + ' )';
    var missing = propertyValue === undefined || propertyValue === null;

    if (propertyValue == 'DontCascade') {
      // cascade stopped!
      // if it were allowed to cascade, propertyValue would equal undefined or null instead of this string which is a special case
      return;
    }

    switch (required) {
      case REQUIRED.REQUIRED: {
        if (missing) failed(badness);
        break;
      }
      case REQUIRED.WARNING: {
        if (missing) warning(badness);
        break;
      }
      default: {
        if (missing) info(badness);
        break;
      }
    }
  },

  /*
    This function goes through the "keys" ("Build", "CI", "Link"),
    in order to see if the SAM.YML was defined and has a value
  */
  findValueGivenKeys: function (keys) {
    var value = globalDoc;

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
  recurseIntoArray: function (recursedSchema, keys, nameOfLastProperty, failed, warning, info) {
    for (schemaValue in recursedSchema) {
      if (typeof recursedSchema[schemaValue] == 'string') {
        if (schemaValue == 'Required') {
          var docValue = this.findValueGivenKeys(keys);
          this.verifyProperty(
            docValue,
            recursedSchema[schemaValue],
            nameOfLastProperty,
            keys,
            failed,
            warning,
            info
          );
        } else {
          var temp = [...keys]; // this weird syntax "[...ArrayToCopy];" just makes a copy of the array and stores it
          temp.push(schemaValue);
          var result = this.findValueGivenKeys(temp);
          this.verifyProperty(
            result,
            recursedSchema[schemaValue],
            schemaValue,
            temp,
            failed,
            warning,
            info
          );
        }
      } else {
        if (schemaValue == 'listCheck') {
          var temp = [...keys];
          var docValue = this.findValueGivenKeys(temp);

          if (docValue !== undefined && docValue !== null) {
            for (child in docValue) {
              for (property in recursedSchema[schemaValue]) {
                var tempKeys = [...temp];

                tempKeys.push(child);
                tempKeys.push(property);
                var tempDocValue = this.findValueGivenKeys(tempKeys);
                this.verifyProperty(
                  tempDocValue,
                  recursedSchema[schemaValue][property],
                  property,
                  tempKeys,
                  failed,
                  warning,
                  info
                );
              }
            }
          }
        } else {
          var newKeys = [...keys];
          newKeys.push(schemaValue);
          this.recurseIntoArray(
            recursedSchema[schemaValue],
            newKeys,
            schemaValue,
            failed,
            warning,
            info
          );
        }
      }
    }
  },

  // doc: The SAM.YML parsed document
  // schema: the JSON schema to compare the doc to
  checkDocAgainstSchema: function (doc, schema, failed, warning, info) {
    globalDoc = doc;
    var keys = [];

    this.recurseIntoArray(schema, keys, null, failed, warning, info);
  }
};
