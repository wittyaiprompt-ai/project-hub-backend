const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1 });
projectSchema.index({ members: 1 });

projectSchema.pre('save', function (next) {
  if (!this.members.includes(this.owner)) {
    this.members.push(this.owner);
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
