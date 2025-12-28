// Firebase doesn't require traditional models like Mongoose,
// but we'll keep this file for consistency and to define data structures

class Account {
  constructor(data) {
    this.id = data.id;
    this.user = data.user;
    this.name = data.name;
    this.type = data.type;
    this.balance = data.balance || 0;
    this.currency = data.currency || 'USD';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert to Firestore-compatible object
  toFirestore() {
    return {
      user: this.user,
      name: this.name,
      type: this.type,
      balance: this.balance,
      currency: this.currency,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create from Firestore document
  static fromFirestore(id, data) {
    return new Account({
      id,
      user: data.user,
      name: data.name,
      type: data.type,
      balance: data.balance,
      currency: data.currency,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    });
  }
}

module.exports = Account;