import { model, models, Schema } from "mongoose";

const personSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    nic: { type: String, required: true, trim: true },
    contactNo: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false }
);

const teamSchema = new Schema(
  {
    teamName: { type: String, required: true, trim: true, unique: true },
    teamLogo: { type: String, required: true },
    teamSlogan: { type: String, required: true, trim: true },
    teamMark: { type: Number, default: 0 },
    leader: { type: personSchema, required: true },
    members: {
      type: [personSchema],
      required: true,
    },
    markLogs: {
      type: [
        {
          delta: { type: Number, required: true },
          timestamp: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

delete models.Team;
export const TeamModel = models.Team || model("Team", teamSchema);
