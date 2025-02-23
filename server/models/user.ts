import { Schema, model, Document } from "mongoose";

export interface IDbUser extends Document {
  name: string;
  googleid: string;
}

const UserSchema = new Schema<IDbUser>({
  name: { type: String, required: true },
  googleid: { type: String, required: true },
});

const User = model<IDbUser>("User", UserSchema);

export default User;
