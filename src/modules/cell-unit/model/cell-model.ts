import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICell extends Document {
  branchId: mongoose.Types.ObjectId;
  cellName: string;
  type: 'ZONE' | 'CELL'; 
  leader: string;
  locality: string; 
  meetingDay: string;
  memberCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const CellSchema = new Schema<ICell>(
  {
    branchId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Branch', 
      required: true, 
      index: true 
    },
    cellName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    type: { 
      type: String, 
      enum: ['ZONE', 'CELL'], 
      required: true,
      uppercase: true,
      default: 'CELL' 
    },
    leader: { 
      type: String, 
      required: true,
      trim: true 
    },
    locality: { 
      type: String, 
      required: true,
      trim: true 
    },
    meetingDay: { 
      type: String, 
      default: 'Wednesday',
      // Ensure this matches your form's selectable days
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    memberCount: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'INACTIVE'], 
      uppercase: true,
      default: 'ACTIVE' 
    }
  },
  { 
    timestamps: true,
    // This ensures that when we query, we get 'id' instead of just '_id'
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Prevent duplicate names within the same branch
CellSchema.index({ cellName: 1, branchId: 1 }, { unique: true });

export const CellModel: Model<ICell> = 
  mongoose.models.Cell || mongoose.model<ICell>('Cell', CellSchema);