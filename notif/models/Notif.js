const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const NotifSchema = new mongoose.Schema({
  fromUserId: Number,
  targetUserId: Number,
  type: String,
  content: String,
  createdAt: Date,
});
NotifSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("Notif", NotifSchema);
