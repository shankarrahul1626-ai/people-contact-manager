import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      maxlength: [100, "Name must be 100 characters or fewer."],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [254, "Email must be 254 characters or fewer."],
      validate: {
        validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: "Enter a valid email address.",
      },
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [40, "Phone number must be 40 characters or fewer."],
      default: "",
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, "Company must be 100 characters or fewer."],
      default: "",
    },
    role: {
      type: String,
      trim: true,
      maxlength: [100, "Role must be 100 characters or fewer."],
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes must be 1000 characters or fewer."],
      default: "",
    },
    favorite: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

contactSchema.pre("validate", function validateContactMethods() {
  if (!this.email && !this.phone) {
    this.invalidate("email", "Add an email address or phone number so this contact can be reached.");
  }
});

export default mongoose.model("Contact", contactSchema);
