import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICell extends Document {
  branchId: mongoose.Types.ObjectId;
  cellName: string;
  type: 'Zone' | 'Cell Unit'; // New Field
  leader: string;
  locality: string; 
  meetingDay: string;
  memberCount: number;
  status: 'Active' | 'Inactive';
}

const CellSchema = new Schema<ICell>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    cellName: { type: String, required: true, trim: true },
    type: { 
      type: String, 
      enum: ['Zone', 'Cell Unit'], 
      required: true,
      default: 'Cell Unit' 
    },
    leader: { type: String, required: true },
    locality: { type: String, required: true },
    meetingDay: { 
      type: String, 
      default: 'Wednesday',
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    memberCount: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
  },
  { timestamps: true }
);

// Unique index remains the same: unique name within a branch
CellSchema.index({ cellName: 1, branchId: 1 }, { unique: true });

export const CellModel: Model<ICell> = 
  mongoose.models.Cell || mongoose.model<ICell>('Cell', CellSchema);