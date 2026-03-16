import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendance extends Document {
  branchId: mongoose.Types.ObjectId;
  date: Date;
  event: string;        // Sunday Service, Mid-week, etc.
  description?: string;
  men: number;
  women: number;
  children: number;
  total: number;        // Calculated field
  markedBy: mongoose.Types.ObjectId;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    date: { type: Date, required: true, index: true },
    event: { type: String, required: true },
    description: { type: String },
    men: { type: Number, default: 0 },
    women: { type: Number, default: 0 },
    children: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    markedBy: { type: Schema.Types.ObjectId, ref: 'BranchUser', required: true }
  },
  { timestamps: true }
);

// Pre-save hook to automatically calculate the total
AttendanceSchema.pre('save', function (next) {
  this.total = (this.men || 0) + (this.women || 0) + (this.children || 0);
  next();
});

export const AttendanceModel: Model<IAttendance> = 
  mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);