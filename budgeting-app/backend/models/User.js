// Firebase doesn't require traditional models like Mongoose,
// but we'll keep this file for consistency and to define data structures

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.currency = data.currency || 'USD';
    this.createdAt = data.createdAt || new Date();
  }

  // Convert to Firestore-compatible object
  toFirestore() {
    return {
      name: this.name,
      email: this.email,
      password: this.password,
      currency: this.currency,
      createdAt: this.createdAt
    };
  }

  // Create from Firestore document
  static fromFirestore(id, data) {
    return new User({
      id,
      name: data.name,
      email: data.email,
      password: data.password,
      currency: data.currency,
      createdAt: data.createdAt?.toDate()
    });
  }
}

module.exports = User;