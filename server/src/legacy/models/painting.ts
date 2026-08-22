import mongoose from "mongoose";

const paintingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  year: { type: Number, required: true },
  imgUrl: { type: String, required: true },
  frameColor: { type: String, required: true },
}, {
  timestamps: true,
});

const Painting = mongoose.model("Painting", paintingSchema);
export default Painting;
