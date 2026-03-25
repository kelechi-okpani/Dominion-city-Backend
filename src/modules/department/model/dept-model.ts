import mongoose, { Schema, Document } from 'mongoose';

// --- DEPARTMENT MODEL ---
export interface IDepartment extends Document {
  name: string;
  lead: string;
  description?: string;
  status: 'Active' | 'Onboarding' | 'Inactive';
  branchId: mongoose.Types.ObjectId;
}

const DepartmentSchema = new Schema<IDepartment>({
  name: { type: String, required: true },
  lead: { type: String, required: true },
  description: String,
  status: { type: String, default: 'Active', enum: ['Active', 'Onboarding', 'Inactive'] },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true }
}, { timestamps: true });

export const DepartmentModel = mongoose.model<IDepartment>('Department', DepartmentSchema);

// --- MEMBER MODEL ---
export interface IDepartmentMember extends Document {
  deptId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  initials: string;
  joined: Date;
}

const MemberSchema = new Schema<IDepartmentMember>({
  deptId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  initials: String,
  joined: { type: Date, default: Date.now }
}, { timestamps: true });

MemberSchema.pre('save', function(next) {
  if (this.name) {
    this.initials = this.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  next();
});

export const MemberModel = mongoose.model<IDepartmentMember>('DepartmentMember', MemberSchema);