// Test script to check what AE does with codeflow.json text
(function() {
  var logFile = new File("d:/Code/OCTOBER 2026/14 Code flow extention/scratch/ae_test_log.txt");
  logFile.open("w");
  logFile.writeln("ExtendScript execution started at " + new Date().toString());

  var jsonFile = new File("d:/Code/OCTOBER 2026/14 Code flow extention/scratch/test_heart_star (CodeFlow)/codeflow.json");
  jsonFile.encoding = "UTF-8";
  jsonFile.open("r");
  var rawText = jsonFile.read();
  jsonFile.close();

  logFile.writeln("Raw text read length: " + rawText.length);
  
  var parsed = eval("(" + rawText + ")");
  logFile.writeln("Comps count: " + parsed.comps.length);

  for (var i = 0; i < parsed.comps[0].layers.length; i++) {
    var l = parsed.comps[0].layers[i];
    if (l.type === "text" && l.text) {
      var t = l.text.text || l.text.content;
      logFile.writeln("Layer " + l.id + " (" + l.name + "): text='" + t + "', charCodeAt(0)=" + (t ? t.charCodeAt(0) : "empty") + ", font=" + l.text.font);
    }
  }

  logFile.close();
})();
