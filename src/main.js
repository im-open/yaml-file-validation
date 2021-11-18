const core = require('@actions/core');
const fs = require('fs');
const { LOG_LEVEL, YamlLibrary } = require('./yaml-tools.js');
const sam = require('./sam.json');

let log_level = LOG_LEVEL.information;

let hasFailure = false;
let docFailed = false;
let failed = failure => {
  core.setFailed(failure);
  docFailed = true;
  hasFailure = true;
};

let hasWarn = false;
let docWarn = false;
let warn = warning => {
  if (log_level <= LOG_LEVEL.warning) {
    core.warning(warning);
  }
  docWarn = true;
  hasWarn = true;
};

let info = information => {
  if (log_level <= LOG_LEVEL.information) {
    core.info(information);
  }
};

try {
  let yamlFilePath = core.getInput('yaml-file-path');
  let yamlDocData = fs.readFileSync(yamlFilePath, 'utf8', warn);
  YamlLibrary.loadDocData(yamlDocData);

  info('YAML FILE PATH=' + yamlFilePath);
  let schemaFilePath = core.getInput('schema-file-path');
  let schemaDoc =
    schemaFilePath == 'SAM' ? sam : JSON.parse(fs.readFileSync(schemaFilePath, 'utf8'));
  if (schemaFilePath == 'SAM') {
    info('IM-OPEN SAM.yaml format specified');
  } else {
    if (schemaFilePath !== '') {
      info('SCHEMA FILE PATH=' + schemaFilePath);
    } else {
      failed('Schema file path is empty');
      process.exit(1);
    }
  }

  var input_log_level = core.getInput('log-level');
  info(`Input Logging Level: ${input_log_level}`);
  if (!LOG_LEVEL.validate(input_log_level)) {
    throw 'Invalid logging level specified.';
  } else {
    log_level = LOG_LEVEL[input_log_level];
  }

  if (YamlLibrary.docs.length == 0) {
    failed('No yaml documents detected in ' + yamlFilePath);
    core.setOutput('validation-outcome', 'failed');
  } else {
    for (let i = 0; i < YamlLibrary.docs.length; i++) {
      let doc = YamlLibrary.docs[i];
      let docNumber = i + 1;

      info('Validating Document #' + docNumber);
      YamlLibrary.checkDocAgainstSchema(doc, schemaDoc, failed, warn, info);

      if (docFailed) {
        failed('Document #' + docNumber + ' failed validation.');
      } else {
        if (docWarn) {
          warn('Document #' + docNumber + ' has warnings.');
        } else {
          info('Document #' + docNumber + ' successfully validated.');
        }
      }
      info('Finished Validating Document #' + docNumber);

      docNumber++;
      docFailed = false;
      docWarn = false;
    }

    let result = 'success';
    if (hasFailure) {
      result = 'failure';
    } else if (hasWarn) {
      result = 'warning';
    }
    core.setOutput('validation-outcome', result);
  }
} catch (error) {
  core.setFailed(error.message);
}
