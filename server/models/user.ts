import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  googleid: string;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  googleid: { type: String, required: true },
});

const User = model<IUser>("User", UserSchema);

export default User;
