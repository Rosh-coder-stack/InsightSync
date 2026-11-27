import mongoose from 'mongoose';

const ActionItemSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true,
    trim: true,
  },
  assignee: {
    type: String,
    default: 'Unassigned',
    trim: true,
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending',
  },
});

const MeetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileSizeBytes: {
      type: Number,
      required: true,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    transcript: {
      type: String,
      required: true,
    },
    executiveOverview: {
      type: String,
      required: true,
    },
    keyDecisions: {
      type: [String],
      default: [],
    },
    actionItems: {
      type: [ActionItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

MeetingSchema.index({
  title: 'text',
  executiveOverview: 'text',
  transcript: 'text',
});

const Meeting = mongoose.model('Meeting', MeetingSchema);

export default Meeting;
