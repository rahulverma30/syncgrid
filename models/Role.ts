import mongoose, { Schema } from 'mongoose';

const RoleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: Number,
      default: 100,
    },
  },
  {
    timestamps: true,
  }
);

RoleSchema.index({ slug: 1, companyId: 1 }, { unique: true });

export const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);
