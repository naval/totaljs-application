/**
 * Created by hp on 5/16/2016.
 */
var mongoose = require('mongoose'),
    timestamps = require('mongoose-timestamp'),
// bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10,
    Schema = mongoose.Schema;
var userSchema = new Schema({
    email: {type: String, required: true},
    password: {type: String, required: true},
    created_at: Date,
    updated_at: Date
});
userSchema.plugin(timestamps);
/*userSchema.pre('save', function (next) {
 var user = this;

 // only hash the password if it has been modified (or is new)
 if (!user.isModified('password')) return next();

 // generate a salt
 bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
 if (err) return next(err);

 // hash the password using our new salt
 bcrypt.hash(user.password, salt, function (err, hash) {
 if (err) return next(err);

 // override the cleartext password with the hashed one
 user.password = hash;
 next();
 });
 });
 });

 userSchema.methods.comparePassword = function (candidatePassword, cb) {
 bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
 if (err) return cb(err);
 cb(null, isMatch);
 });
 };*/

userSchema.statics.checkLogin = function checkLogin(body, cb) {
    var User = MODEL('user').schema;
    User.findOne({email: (body.email || ''), password: (body.password || '')}, cb);
}
exports.schema = mongoose.model('user', userSchema);
exports.name = 'user';