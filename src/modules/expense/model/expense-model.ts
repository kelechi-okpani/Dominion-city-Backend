import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
  branchId: mongoose.Types.ObjectId;
  title: string;
  fullName: string;
  amount: number;
  department: string; 
  date: Date;
  status: 'Pending' | 'Approved' | 'Rejected';
  recordedBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    // Ensure this matches your Branch collection name exactly
    branchId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Branch', 
      required: true, 
      index: true 
    },
    title: { type: String, required: true, trim: true },
    fullName: { type: String, required: true,},
    amount: { 
      type: Number, 
      required: true, 
      min: 0,
      // Rounds to 2 decimal places before saving to ensure financial accuracy
      set: (v: number) => Math.round(v * 100) / 100 
    },
    department: { type: String, required: true, index: true },

    // Use Date type but store as the start of the day if you only care about the day
    date: { 
      type: Date, 
      default: Date.now, 
      index: true 
    },
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Rejected'], 
      default: 'Approved',
      index: true 
    },
    // CRITICAL: Ensure 'User' matches the model name of your staff/profiles
    recordedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'BranchUser', 
      required: true 
    },
    isDeleted: { type: Boolean, default: false, index: true }
    
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound Index: Optimizes the 'getBranchExpenses' query which filters by branch AND category
ExpenseSchema.index({ branchId: 1, category: 1 });

export const ExpenseModel: Model<IExpense> = 
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);