const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    savedLocations: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Location',
          required: true
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
);

userSchema.statics.signin = async function (email, password) {
  const user = await this.findOne({ email });

  if (!user) {
    throw Error('No account found for this email');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw Error('Incorrect password');
  }

  return user;
};

userSchema.statics.signup = async function (name, email, password) {
  if (!validator.isStrongPassword(password)) {
    throw Error('Use a stronger password with uppercase and lowercase letters, numbers, and symbols');
  }

  const userExists = await this.findOne({ email });

  if (userExists) {
    throw Error('This email is already associated with an account');
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await this.create({ name, email, password: hash });

  return user;
};

module.exports = mongoose.model('User', userSchema);
