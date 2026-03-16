import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
  branchId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  amount: number;
  category: string; // e.g., "Rent", "Utilities", "Honorarium", "Maintenance"
  department?: string; // e.g., "Media", "Choir", "Ushering"
  date: Date;
  status: 'Pending' | 'Approved' | 'Rejected';
  recordedBy: mongoose.Types.ObjectId;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    department: { type: String },
    date: { type: Date, default: Date.now, index: true },
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Rejected'], 
      default: 'Pending' 
    },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'BranchUser', required: true }
  },
  { timestamps: true }
);

export const ExpenseModel: Model<IExpense> = 
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);