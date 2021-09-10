const core = require('@actions/core');
const yaml = require('js-yaml');
const fs = require('fs');
const yamlLibrary = require('./yaml-library.js');
const sam = require('./sam.json');

let docFailed = false;
let failed = failure => {
  core.setFailed(failure);
  docFailed = true;
};
let warn = warning => core.warning(warning);
let info = information => core.info(information);

try {
  let yamlFilePath = core.getInput('yaml-file');
  let yamlDocs = yaml.loadAll(fs.readFileSync(yamlFilePath, 'utf8', warn));
  info('YAML FILE PATH=' + yamlFilePath);

  let schemaFilePath = core.getInput('schema-file');
  let schemaDoc = schemaFilePath == 'SAM' ? sam : JSON.parse(fs.readFileSync(schemaFilePath, 'utf8'));
  if(schemaFilePath == 'SAM'){
    info('IM-OPEN SAM.yaml format specified');
  } else {
    info('SCHEMA FILE PATH=' + schemaFilePath);
  };

  let docNumber = 1;
  if (yamlDocs.length == 0) {
    failed('No yaml documents detected in ' + yamlFilePath);
  } else {
    yamlDocs.forEach(doc => {
      info('Validating Document #' + docNumber);
      yamlLibrary.checkDocAgainstSchema(doc, schemaDoc, failed, warn, info);
      if (docFailed) {
        failed('Document #' + docNumber + ' failed validation.');
      } else {
        info('Document #' + docNumber + ' successfully validated.');
      }

      info('Finished Validating Document #' + docNumber);

      docNumber++;
      docFailed = false;
    });
  }
} catch (error) {
  core.setFailed(error.message);
}