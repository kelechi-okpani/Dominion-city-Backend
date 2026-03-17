import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the specific course types allowed in DC
export type AcademyCourse = 'DLI BASIC' | 'DLI ADVANCE' | 'DCA BASIC' | 'DCA ADVANCE';

export interface IAcademy extends Document {
  branchId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  courseName: AcademyCourse; 
  location: string;   
  phone: string;
  date: Date;
  status: 'Enrolled' | 'Completed' | 'Dropped';
  addedBy: mongoose.Types.ObjectId;
}

const AcademySchema = new Schema<IAcademy>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: false, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    courseName: { 
      type: String, 
      required: true,
      enum: ['DLI_BASIC', 'DLI_ADVANCE', 'DCA_BASIC', 'DCA_ADVANCE'] 
    },
    location: { type: String, required: false, default: 'Online' },
    phone: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['Enrolled', 'Completed', 'Dropped'], 
      default: 'Enrolled' 
    },
    addedBy: { type: Schema.Types.ObjectId, ref: 'BranchUser', required: false }
  },
  { timestamps: true }
);

// Unique index to prevent a student from enrolling in the same course twice in one branch
AcademySchema.index({ email: 1, courseName: 1, branchId: 1 }, { unique: true });

export const AcademyModel: Model<IAcademy> = 
  mongoose.models.Academy || mongoose.model<IAcademy>('Academy', AcademySchema);