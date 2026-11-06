import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    handle: { type: String, required: true, unique: true, lowercase: true },
    role: { type: String, enum: ["student", "instructor"], default: "student" },
  },
  { timestamps: true },
);

const submissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    challenge: { type: String, required: true, index: true },
    language: { type: String, enum: ["python", "javascript"], required: true },
    code: { type: String, required: true, maxlength: 20000 },
    passed: { type: Boolean, required: true },
    passedCount: { type: Number, required: true },
    total: { type: Number, required: true },
    verified: { type: Boolean, default: false },
    runtimeMs: Number,
  },
  { timestamps: true },
);

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    challenge: { type: String, required: true, index: true },
    type: { type: String, enum: ["hint", "tutor"], required: true },
    level: Number,
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
export const Submission = mongoose.model("Submission", submissionSchema);
export const Activity = mongoose.model("Activity", activitySchema);
