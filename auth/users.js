exports.findById = function(id, cb, db) {
  process.nextTick(function() {
	var idx = id - 1;
	db.collection('admin').find({}).toArray(function(err,records){
		if (records[idx]) {
		  cb(null, records[idx]);
		} else {
		  cb(new Error('User ' + id + ' does not exist'));
		}
	});
  });
}
exports.findByUsername = function(username, cb, db) {
  process.nextTick(function() {
	db.collection('admin').find({}).toArray(function(err,records){
		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];
				if (record.username === username) {
					return cb(null, record);
				}
		}
		return cb(null, null);
	});
  });
}