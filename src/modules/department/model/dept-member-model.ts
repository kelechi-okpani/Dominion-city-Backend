import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing a member within a specific church department.
 */
export interface IDeptMember extends Document {
  deptId: mongoose.Types.ObjectId;  // Link to the specific Department
  branchId: mongoose.Types.ObjectId; // Scoped to the branch for easier querying
  name: string;
  phone?: string;
  email?: string;
  initials: string;                 // e.g., "ON" for Obinna Nwosu
  joined: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeptMemberSchema = new Schema<IDeptMember>(
  {
    deptId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department ID is required'],
      index: true
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    initials: {
      type: String,
      uppercase: true,
      required: true
    },
    joined: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * VIRTUALS
 * Maps _id to id for GraphQL compatibility.
 */
DeptMemberSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

/**
 * INDEXES
 * Prevents adding the same email to the same department twice.
 */
DeptMemberSchema.index({ deptId: 1, email: 1 }, { unique: true, sparse: true });

export const DeptMemberModel = mongoose.models.DeptMember || mongoose.model('DeptMember', DeptMemberSchema);