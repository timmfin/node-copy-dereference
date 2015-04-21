var fs = require('fs')
var path = require('path')


function copyFile(source, target, options, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

module.exports = copyDereference
function copyDereference (src, dest, callback) {
  fs.stat(src, function(err, srcStats) {
    if (err != null) return callback(err);

    if (srcStats.isDirectory()) {
      // TODO
      throw new Error("copyDereference async not implemented for dirs yet")

    } else if (srcStats.isFile()) {
      copyFile(src, dest, { flag: 'wx', mode: srcStats.mode }, function(err) {
        if (err != null) return callback(err);

        fs.utimes(dest, srcStats.atime, srcStats.mtime, function(err) {
          if (err != null) {
            callback(err);
          } else {
            callback();
          }
        });
      });
    } else {
      callback(new Error('Unexpected file type for ' + src));
    }

  });
}

module.exports.sync = copyDereferenceSync
function copyDereferenceSync (src, dest) {
  // We could try readdir'ing and catching ENOTDIR exceptions, but that is 3x
  // slower than stat'ing in the common case that we have a file.
  var srcStats = fs.statSync(src)
  if (srcStats.isDirectory()) {
    // We do not copy the directory mode by passing a second argument to
    // mkdirSync, because we wouldn't be able to populate read-only
    // directories. If we really wanted to preserve directory modes, we could
    // call chmodSync at the end.
    fs.mkdirSync(dest)
    var entries = fs.readdirSync(src).sort()
    for (var i = 0; i < entries.length; i++) {
      copyDereferenceSync(src + path.sep + entries[i], dest + path.sep + entries[i])
    }
  } else if (srcStats.isFile()) {
    var contents = fs.readFileSync(src)
    fs.writeFileSync(dest, contents, { flag: 'wx', mode: srcStats.mode })
  } else {
    throw new Error('Unexpected file type for ' + src)
  }
  fs.utimesSync(dest, srcStats.atime, srcStats.mtime)
}
