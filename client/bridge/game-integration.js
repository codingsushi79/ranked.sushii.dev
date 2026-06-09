const { installGsiConfig, detectGsiInstalled } = require("./gsi-install");
const { installJsiScripts, inspectJsiScripts } = require("./jsi-install");

function installGameIntegration(config = {}) {
  const gsi = installGsiConfig();
  const jsi = installJsiScripts(config);

  return {
    ok: gsi.ok && jsi.ready,
    gsi,
    jsi,
    updatedAt: new Date().toISOString(),
  };
}

function inspectGameIntegration(config = {}) {
  const gsiInstalled = detectGsiInstalled();
  const jsi = inspectJsiScripts(config);

  return {
    ok: gsiInstalled && jsi.ready,
    gsiInstalled,
    jsi,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  installGameIntegration,
  inspectGameIntegration,
};
