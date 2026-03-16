import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;        // e.g., "CHOIR", "MEDIA"
  branchId: mongoose.Types.ObjectId; 
  lead: string;        // Matches your React 'lead' state
  description?: string;
  status: 'Active' | 'Inactive' | 'Onboarding';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { 
      type: String, 
      required: [true, 'Department name is required'], 
      trim: true 
    },
    code: { 
      type: String, 
      required: [true, 'Department code is required'], 
      uppercase: true,
      trim: true 
    },
    branchId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Branch', 
      required: true, 
      index: true 
    }, 
    lead: { 
      type: String, 
      required: [true, 'Department lead is required'] 
    },
    description: { type: String },
    status: { 
      type: String, 
      enum: ['Active', 'Inactive', 'Onboarding'], 
      default: 'Active' 
    },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Prevent duplicate codes within the same branch
DepartmentSchema.index({ branchId: 1, code: 1 }, { unique: true });

DepartmentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export const DepartmentModel: Model<IDepartment> = 
  mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);