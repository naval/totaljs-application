/**
 * Created by hp on 5/16/2016.
 */
var mongoose = require('mongoose'),
    timestamps = require('mongoose-timestamp'),
    Schema = mongoose.Schema;
var productSchema = new Schema({
    title: {type:String,required:true},
    description: {type:String,required:true},
    price: {type:Number,required:true},
    image_url: {type:String,required:true},
    _userId: {type:Schema.Types.ObjectId,required:true},
    created_at: Date,
    updated_at: Date
});
productSchema.plugin(timestamps);
exports.schema = mongoose.model('product', productSchema);
exports.name = 'product';